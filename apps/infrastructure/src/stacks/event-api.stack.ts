import { CorsHttpMethod, HttpApi, HttpMethod } from '@aws-cdk/aws-apigatewayv2-alpha';
import { HttpJwtAuthorizer } from '@aws-cdk/aws-apigatewayv2-authorizers-alpha';
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import { Aws, CfnOutput, Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { CfnStage } from 'aws-cdk-lib/aws-apigatewayv2';
// import { AuthorizationType, EndpointType, LambdaRestApi, RestApi, TokenAuthorizer } from 'aws-cdk-lib/aws-apigateway';
import { Table, AttributeType, ProjectionType, BillingMode, ITable } from 'aws-cdk-lib/aws-dynamodb';
import { Effect, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { LayerVersion, Runtime, Code, Alias } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { LogGroup } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { join } from 'path';
import { generateResourceName } from '../utils';
import { DynamoDBConfig } from '../utils/interfaces';

export interface EventApiProps extends StackProps {
    nodeEnv: string;
    assumeNpRoleArn: string;
    eventBusArn: string;
    eventBusArnNp: string;
    dlqArn: string;
    dlqArnNp: string;
    invokeApiDestRoleArn: string;
    invokeApiDestRoleArnNp: string;
    putEventBusDestRoleArn: string;
    putEventBusDestRoleArnNp: string;
    eventFailuresTableNameNP: string;
    eventFailuresTableNamePRD: string;
    schemaRegistryName: string;
    portalClientId: string;
    ddbTableConfig: DynamoDBConfig;
}

export class EventApiStack extends Stack {
    apiLambda: NodejsFunction;
    apiGw: HttpApi;
    // apiGwR: RestApi;
    schemasTable: Table;
    eventStoreTable: Table;
    domainStoreTable: Table;
    subscriptionsDbTable: Table;
    applicationsTable: Table;
    eventFailuresTableNp: ITable;
    eventFailuresTablePrd: ITable;

    constructor(scope: Construct, id: string, props: EventApiProps) {
        const {
            nodeEnv,
            assumeNpRoleArn,
            eventBusArn,
            eventBusArnNp,
            schemaRegistryName,
            portalClientId,
            dlqArn,
            dlqArnNp,
            invokeApiDestRoleArn,
            invokeApiDestRoleArnNp,
            putEventBusDestRoleArn,
            putEventBusDestRoleArnNp,
            eventFailuresTableNameNP,
            eventFailuresTableNamePRD,
            ddbTableConfig,
            ...stackProps
        } = props;

        super(scope, id, stackProps);

        // Create the DynamoDB table to store events
        this.eventStoreTable = new Table(this, 'EventSourcingTable', {
            partitionKey: {
                name: 'event',
                type: AttributeType.STRING,
            },
            sortKey: {
                name: 'created',
                type: AttributeType.STRING,
            },
            billingMode: BillingMode.PROVISIONED,
            // removalPolicy: nodeEnv === 'development' ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN,
        });
        this._configureDDBAutoScaling(this.eventStoreTable, ddbTableConfig);

        // Create the DynamoDB table to store schemas
        this.schemasTable = new Table(this, 'SchemasTable', {
            partitionKey: {
                name: 'PK',
                type: AttributeType.STRING,
            },
            sortKey: {
                name: 'SK',
                type: AttributeType.STRING,
            },
            billingMode: BillingMode.PROVISIONED,
            // removalPolicy: nodeEnv === 'development' ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN,
        });
        this._configureDDBAutoScaling(this.schemasTable, ddbTableConfig);

        // Create the DynamoDB table to store domains
        this.domainStoreTable = new Table(this, 'BusinessDomainTable', {
            partitionKey: {
                name: 'PK',
                type: AttributeType.STRING,
            },
            sortKey: {
                name: 'Path',
                type: AttributeType.STRING,
            },
            billingMode: BillingMode.PROVISIONED,
            // removalPolicy: nodeEnv === 'development' ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN,
        });
        this._configureDDBAutoScaling(this.domainStoreTable, ddbTableConfig);

        // Create the DynamoDB table to store subscriptions
        this.subscriptionsDbTable = new Table(this, 'SubscriptionsTable', {
            partitionKey: {
                name: 'PK',
                type: AttributeType.STRING,
            },
            sortKey: {
                name: 'SK',
                type: AttributeType.STRING,
            },
            billingMode: BillingMode.PROVISIONED,
            // removalPolicy: nodeEnv === 'development' ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN,
        });
        this._configureDDBAutoScaling(this.subscriptionsDbTable, ddbTableConfig);
        // Add secondary indexes with same autoscaling
        this.subscriptionsDbTable.addGlobalSecondaryIndex({
            indexName: 'SchemaName-PK',
            partitionKey: { name: 'SchemaName', type: AttributeType.STRING },
            sortKey: { name: 'PK', type: AttributeType.STRING },
            readCapacity: 1,
            writeCapacity: 1,
            projectionType: ProjectionType.ALL,
        });
        this.subscriptionsDbTable
            .autoScaleGlobalSecondaryIndexReadCapacity('SchemaName-PK', {
                minCapacity: ddbTableConfig.autoScaling.readCapacity.min,
                maxCapacity: ddbTableConfig.autoScaling.readCapacity.max,
            })
            .scaleOnUtilization({
                targetUtilizationPercent: ddbTableConfig.autoScaling.targetUtilisationPercent,
            });

        // Create DynamoDB table to store application data registed in Integration Hub
        this.applicationsTable = new Table(this, 'ApplicationsTable', {
            partitionKey: {
                name: 'PK',
                type: AttributeType.STRING,
            },
            billingMode: BillingMode.PROVISIONED,
            pointInTimeRecovery: ddbTableConfig.pointInTimeRecovery,
            // removalPolicy: nodeEnv === 'development' ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN,
        });
        this._configureDDBAutoScaling(this.applicationsTable, ddbTableConfig);

        /**
         * Lambda Layers
         */
        const layerNest = new LayerVersion(this, 'ProxyNestJsLambdaLayer', {
            compatibleRuntimes: [Runtime.NODEJS_18_X],
            layerVersionName: generateResourceName('EventApi-ProxyNestJsLambdaLayer'),
            code: Code.fromAsset(join(__dirname, '../../resources/lambda-layers/nestjs')),
            description: 'Includes NestJS Libs',
        });

        const layerSdk = new LayerVersion(this, 'ProxySdkLambdaLayer', {
            compatibleRuntimes: [Runtime.NODEJS_18_X],
            layerVersionName: generateResourceName('EventApi-ProxySdkLambdaLayer'),
            code: Code.fromAsset(join(__dirname, '../../resources/lambda-layers/aws-sdk')),
            description: 'Includes AWS-SDK v3',
        });

        /**
         * Lambda Policies
         */
        const secretsPolicy = new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
                'secretsmanager:GetSecretValue',
                'secretsmanager:PutSecretValue',
                'secretsmanager:ListSecrets',
                'secretsmanager:CreateSecret',
                'secretsmanager:DeleteSecret',
                'secretsmanager:DescribeSecret',
                'secretsmanager:UpdateSecret',
            ],
            resources: [`arn:aws:secretsmanager:${Aws.REGION}:${Aws.ACCOUNT_ID}:secret:events!connection/*`],
        });

        const schemasPolicy = new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
                'schemas:ListSchemas',
                'schemas:ListSchemaVersions',
                'schemas:ListRegistries',
                'schemas:ListTagsForResource',
                'schemas:SearchSchemas',
                'schemas:DescribeSchema',
                'schemas:DescribeRegistry',
                'schemas:CreateSchema',
                'schemas:UpdateSchema',
                'schemas:DeleteSchema',
                'schemas:TagResource',
                'schemas:UntagResource',
            ],
            resources: [
                `arn:aws:schemas:${Aws.REGION}:${Aws.ACCOUNT_ID}:registry/${schemaRegistryName}`,
                `arn:aws:schemas:${Aws.REGION}:${Aws.ACCOUNT_ID}:registry/${schemaRegistryName}/*`,
                `arn:aws:schemas:${Aws.REGION}:${Aws.ACCOUNT_ID}:schema/${schemaRegistryName}`,
                `arn:aws:schemas:${Aws.REGION}:${Aws.ACCOUNT_ID}:schema/${schemaRegistryName}/*`,
            ],
        });

        const subscriptionsPolicy = new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
                'events:PutRule',
                'events:PutTargets',
                'events:TagResource',
                'events:EnableRule',
                'events:DisableRule',
                'events:DeleteRule',
                'events:RemoveTargets',
                'events:ListTargetsByRule',
                'events:TagResource',
                'events:ListRules',
                'events:ListTargetsByRule',
                'events:ListTagsForResource',
                'events:DescribeRule',
                'events:CreateApiDestination',
                'events:DeleteApiDestination',
                'events:UpdateApiDestination',
                'events:ListApiDestinations',
                'events:CreateConnection',
                'events:DeleteConnection',
                'events:UpdateConnection',
                'events:ListConnections',
                'events:DeauthorizeConnection',
                'events:DescribeConnection',
            ],
            resources: [
                `${eventBusArn}/*`,
                `${eventBusArnNp}/*`,
                `arn:aws:events:${Aws.REGION}:${Aws.ACCOUNT_ID}:rule/*`,
                `arn:aws:events:${Aws.REGION}:${Aws.ACCOUNT_ID}:connection/*`,
                `arn:aws:events:${Aws.REGION}:${Aws.ACCOUNT_ID}:api-destination/*`,
            ],
        });

        const iamPolicy = new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ['iam:PassRole', 'iam:GetRole'],
            resources: [invokeApiDestRoleArnNp, invokeApiDestRoleArn, putEventBusDestRoleArn, putEventBusDestRoleArnNp],
        });

        const logsPolicy = new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ['logs:GetQueryResults', 'logs:StartQuery', 'logs:StopQuery'],
            resources: [`arn:aws:logs:${Aws.REGION}:${Aws.ACCOUNT_ID}:log-group:*`],
        });

        /**
         * Schema API Request Lambdas
         */
        this.apiLambda = new NodejsFunction(this, 'ProxyLambda', {
            functionName: generateResourceName('EventApi-ProxyLambda'),
            entry: join(__dirname, '../../../../dist/apps/api/main.js'),
            environment: {
                NODE_ENV: nodeEnv,
                ASSUME_NP_ROLE_ARN: assumeNpRoleArn,
                EVENT_BUS_ARN: eventBusArn,
                EVENT_BUS_ARN_NP: eventBusArnNp,
                DLQ_ARN: dlqArn,
                DLQ_ARN_NP: dlqArnNp,
                INVOKE_API_DEST_ROLE_ARN: invokeApiDestRoleArn,
                INVOKE_API_DEST_ROLE_ARN_NP: invokeApiDestRoleArnNp,
                PUT_EVENT_BUS_DEST_ROLE_ARN: putEventBusDestRoleArn,
                PUT_EVENT_BUS_DEST_ROLE_ARN_NP: putEventBusDestRoleArnNp,
                SCHEMA_REGISTRY_NAME: schemaRegistryName,
                DDB_EVENT_STORE_TABLE_NAME: this.eventStoreTable.tableName,
                DDB_DOMAINS_TABLE_NAME: this.domainStoreTable.tableName,
                DDB_SUBSCRIPTIONS_TABLE_NAME: this.subscriptionsDbTable.tableName,
                DDB_APPLICATIONS_TABLE_NAME: this.applicationsTable.tableName,
                DDB_SCHEMAS_TABLE_NAME: this.schemasTable.tableName,
                DDB_EVENT_FAILURES_TABLE_NAME_NP: eventFailuresTableNameNP,
                DDB_EVENT_FAILURES_TABLE_NAME_PRD: eventFailuresTableNamePRD,
                AZURE_CLIENT_ID: portalClientId,
                AWS_ACCOUNT_ID: Aws.ACCOUNT_ID,
                LOG_LEVEL: 'INFO',
            },
            memorySize: 1024,
            timeout: Duration.seconds(5),
            runtime: Runtime.NODEJS_18_X,
            layers: [layerNest, layerSdk],
            bundling: {
                externalModules: [
                    '@aws-lambda-powertools/logger',
                    '@aws-sdk/client-apigatewaymanagementapi',
                    '@aws-sdk/client-cloudwatch-logs',
                    '@aws-sdk/client-dynamodb',
                    '@aws-sdk/client-eventbridge',
                    '@aws-sdk/client-iam',
                    '@aws-sdk/client-s3',
                    '@aws-sdk/client-schemas',
                    '@aws-sdk/client-secrets-manager',
                    '@aws-sdk/client-sts',
                    '@aws-sdk/lib-dynamodb',
                    '@azure/msal-node',
                    '@nestjs/common',
                    '@nestjs/config',
                    '@nestjs/core',
                    '@nestjs/event-emitter',
                    '@nestjs/mapped-types',
                    '@nestjs/passport',
                    '@nestjs/platform-express',
                    '@vendia/serverless-express',
                    'cache-manager',
                    'class-transformer',
                    'class-validator',
                    'express',
                    'joi',
                    'json-schema-to-typescript',
                    'jsonwebtoken',
                    'lodash',
                    'luxon',
                    'passport',
                    'passport-azure-ad',
                    'reflect-metadata',
                    'rxjs',
                    'source-map-support',
                    'ts-lib',
                    'zod',
                ],
            },
            initialPolicy: [schemasPolicy, subscriptionsPolicy, secretsPolicy, iamPolicy, logsPolicy],
        });

        // const version = this.apiLambda.currentVersion;
        // const alias = new Alias(this, 'LambdaProxyAlias', {
        //     aliasName: 'InUse',
        //     version,
        //     provisionedConcurrentExecutions: 0,
        // });

        this.applicationsTable.grantReadWriteData(this.apiLambda);
        this.domainStoreTable.grantReadWriteData(this.apiLambda);
        this.eventStoreTable.grantReadWriteData(this.apiLambda);
        this.schemasTable.grantReadWriteData(this.apiLambda);
        this.subscriptionsDbTable.grantReadWriteData(this.apiLambda);

        // add permissions to event failure table
        this.eventFailuresTableNp = Table.fromTableAttributes(this, 'EventFailuresTableNP', {
            tableName: `${props.eventFailuresTableNameNP}`,
            grantIndexPermissions: true,
        });
        this.eventFailuresTablePrd = Table.fromTableAttributes(this, 'EventFailuresTablePrd', {
            tableName: props.eventFailuresTableNamePRD,
            grantIndexPermissions: true,
        });
        this.eventFailuresTableNp.grantReadWriteData(this.apiLambda);
        this.eventFailuresTablePrd.grantReadWriteData(this.apiLambda);

        if (nodeEnv === 'production' || nodeEnv === 'qa') {
            this.apiLambda.addToRolePolicy(
                new PolicyStatement({
                    effect: Effect.ALLOW,
                    actions: ['sts:AssumeRole'],
                    resources: [assumeNpRoleArn],
                }),
            );
        }

        /**
         * API Gateway
         */
        const proxyIntegration = new HttpLambdaIntegration('ProxyApiGWIntegration', this.apiLambda);
        const authorizer = new HttpJwtAuthorizer(
            'EventApiAuthorizer',
            'https://login.microsoftonline.com/a3299bba-ade6-4965-b011-bada8d1d9558/v2.0',
            {
                jwtAudience: [portalClientId],
            },
        );

        this.apiGw = new HttpApi(this, 'ProxyApiGW', {
            apiName: generateResourceName('EventApi-ProxyApiGW'),
            description: 'Integration Platform Event API Gateway',
            defaultAuthorizationScopes: [],
            corsPreflight: {
                allowOrigins: ['*'],
                allowMethods: [CorsHttpMethod.ANY],
                allowHeaders: ['*'],
            },
        });

        // API GW Routes
        this.apiGw.addRoutes({
            path: '/{proxy+}',
            methods: [HttpMethod.GET, HttpMethod.POST, HttpMethod.PUT, HttpMethod.DELETE],
            integration: proxyIntegration,
            authorizer: authorizer,
        });

        this.apiGw.addRoutes({
            path: '/{proxy+}',
            methods: [HttpMethod.OPTIONS],
            integration: proxyIntegration,
            // authorizer: undefined,
        });

        // API GW Logging
        const accessLogs = new LogGroup(this, 'AccessLogs');

        const role = new Role(this, 'LogWriterRole', {
            assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
        });

        const policy = new PolicyStatement({
            actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:DescribeLogGroups',
                'logs:DescribeLogStreams',
                'logs:PutLogEvents',
                'logs:GetLogEvents',
                'logs:FilterLogEvents',
            ],
            resources: ['*'],
        });

        role.addToPolicy(policy);
        accessLogs.grantWrite(role);

        const stage = this.apiGw.defaultStage!.node.defaultChild as CfnStage;
        stage.accessLogSettings = {
            destinationArn: accessLogs.logGroupArn,
            format: JSON.stringify({
                requestId: '$context.requestId',
                userAgent: '$context.identity.userAgent',
                sourceIp: '$context.identity.sourceIp',
                requestTime: '$context.requestTime',
                requestTimeEpoch: '$context.requestTimeEpoch',
                httpMethod: '$context.httpMethod',
                path: '$context.path',
                status: '$context.status',
                protocol: '$context.protocol',
                responseLength: '$context.responseLength',
                domainName: '$context.domainName',
            }),
        };

        new CfnOutput(this, 'EAIEventApiGwEndpoint', { value: `${this.apiGw.url}` });
        new CfnOutput(this, 'EAIEventApiLambdaName', { value: `${this.apiLambda.functionName}` });
        new CfnOutput(this, 'EAIEventApiEventStoreTableName', { value: `${this.eventStoreTable.tableName}` });
        new CfnOutput(this, 'EAIEventApiDomainsStoreTableName', { value: `${this.domainStoreTable.tableName}` });
        new CfnOutput(this, 'EAIEventApiSubscriptionsTableName', { value: `${this.subscriptionsDbTable.tableName}` });
        new CfnOutput(this, 'EAIEventApiApplicationsTableName', { value: `${this.applicationsTable.tableName}` });
        new CfnOutput(this, 'EAIEventApiSchemasTableName', { value: `${this.schemasTable.tableName}` });
    }

    private _configureDDBAutoScaling(table: Table, ddbTableConfig: DynamoDBConfig) {
        table
            .autoScaleReadCapacity({
                minCapacity: ddbTableConfig.autoScaling.readCapacity.min,
                maxCapacity: ddbTableConfig.autoScaling.readCapacity.max,
            })
            .scaleOnUtilization({
                targetUtilizationPercent: ddbTableConfig.autoScaling.targetUtilisationPercent,
            });
        table
            .autoScaleWriteCapacity({
                minCapacity: ddbTableConfig.autoScaling.writeCapacity.min,
                maxCapacity: ddbTableConfig.autoScaling.writeCapacity.max,
            })
            .scaleOnUtilization({
                targetUtilizationPercent: ddbTableConfig.autoScaling.targetUtilisationPercent,
            });
    }
}
