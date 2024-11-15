import { Aws, CfnOutput, CfnResource, Duration, Stack, StackProps } from 'aws-cdk-lib';
import { AttributeType, BillingMode, ITable, ProjectionType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { EventBus, IEventBus } from 'aws-cdk-lib/aws-events';
// import { CfnRegistry } from 'aws-cdk-lib/aws-eventschemas';
import {
    ArnPrincipal,
    Effect,
    ManagedPolicy,
    PolicyDocument,
    PolicyStatement,
    Role,
    ServicePrincipal,
} from 'aws-cdk-lib/aws-iam';
import { Code, LayerVersion, Runtime } from 'aws-cdk-lib/aws-lambda';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Bucket, EventType, IBucket } from 'aws-cdk-lib/aws-s3';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';
import { Queue, QueueEncryption } from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import { join } from 'path';
import { EventLogger } from '../constructs/event-logger.construct';
import { generateResourceName } from '../utils';
import { DynamoDBConfig } from '../utils/interfaces';

export interface EventBrokerStackProps extends StackProps {
    nodeEnv: string;
    suffix?: string;
    eventBucketName: string;
    ddbTableConfig: DynamoDBConfig;
    applicationsTableName: string;
    subscriptionsTableName: string;
    schemasTableName: string;
    sesRole: string;
    eventBusArn: string;
    eventEmailLambdaRoleArnNp?: string;
    ddbTableReadRoleProdArn?: string;
}

export class EventBrokerStack extends Stack {
    eventBucket: IBucket;
    eventBus: IEventBus;
    eventBusDlq: Queue;
    apiDestTargetRole: Role;
    eventBusTargetRole: Role;
    emailDlqLambdaRole: Role;
    s3TaggingLambdaRole: Role;
    eventDLQLambda: NodejsFunction;
    dlqNotificationLambda: NodejsFunction;
    s3TaggingLambda: NodejsFunction;
    ddbTableReadRoleProd?: Role;
    dlqTable: Table;
    eventFailuresTable: Table;
    applicationsTable: ITable;
    subscriptionsTable: ITable;
    schemasTable: ITable;
    emailSchedulerRole: Role;
    emailScheduler: CfnResource;
    // schemaRegistry: CfnRegistry;

    constructor(scope: Construct, id: string, props: EventBrokerStackProps) {
        super(scope, id, props);

        // this.eventBus = new EventBus(this, `EventBus${props.suffix}`, {
        //     eventBusName: generateResourceName('EventBus', props.suffix),
        // });

        // // Create the Bus Archive
        // this.eventBus.archive(generateResourceName('EventBusArchived'), {
        //     eventPattern: {}, // TODO: try and find a way to filter only for {source: wel.*} events
        //     retention: Duration.days(30),
        // });

        // this.eventBus = EventBus.fromEventBusName(this, `EventBus${props.suffix}`, props.eventBusName);
        this.eventBus = EventBus.fromEventBusArn(this, `EventBus${props.suffix}`, props.eventBusArn);

        // Create S3 for storing event payloads
        // const { PROJECT_CODE, CDK_STAGE } = getEnvVars();
        // const bucketName = `wel-${PROJECT_CODE}-event-bucket-${CDK_STAGE}${
        //     props.suffix ? '-' + props.suffix : ''
        // }`.toLowerCase();
        // this.eventBucket = new Bucket(this, `EventS3Bucket${props.suffix}`, {
        //     bucketName: bucketName,
        //     objectOwnership: ObjectOwnership.BUCKET_OWNER_ENFORCED,
        //     lifecycleRules: [
        //         {
        //             id: generateResourceName('EventS3Bucket-LifeCycleRule-30d', props.suffix),
        //             enabled: true,
        //             expiration: Duration.days(30),
        //         },
        //     ],
        // });
        this.eventBucket = Bucket.fromBucketName(this, `EventS3Bucket${props.suffix}`, props.eventBucketName);
        this.applicationsTable = Table.fromTableName(this, 'ApplicationsTable', `${props.applicationsTableName}`);
        this.subscriptionsTable = Table.fromTableName(this, 'SubscriptionsTable', `${props.subscriptionsTableName}`);
        this.schemasTable = Table.fromTableName(this, 'SchemasTable', `${props.schemasTableName}`);

        // create the lambda layers
        const extLibLayer = new LayerVersion(this, 'BrokerSdkLambdaLayer', {
            compatibleRuntimes: [Runtime.NODEJS_18_X],
            layerVersionName: generateResourceName('EventBroker-BrokerSdkLambdaLayer'),
            code: Code.fromAsset(join(__dirname, '../../resources/lambda-layers/aws-sdk')),
            description:
                'External libraries for Event Broker Lambdas. Includes AWS-SDK v3 and other dependencies used in broker',
        });

        const powertoolsLayer = LayerVersion.fromLayerVersionArn(
            this,
            'PowertoolsLayer',
            `arn:aws:lambda:${Stack.of(this).region}:094274105915:layer:AWSLambdaPowertoolsTypeScript:9`,
        );

        // Add a rule and target lambda to consume and log events for debugging
        new EventLogger(this, `EventLogger${props.suffix}`, {
            eventBus: this.eventBus as EventBus,
            suffix: props.suffix,
            extLibLayer,
            powertoolsLayer,
        });

        /**
         * IAM Roles
         */
        // Generic IAM role to Invoke API Destination Targets
        this.apiDestTargetRole = new Role(this, 'InvokeApiDestRole', {
            roleName: generateResourceName('EventBus-InvokeApiDestRole', props.suffix),
            assumedBy: new ServicePrincipal('events.amazonaws.com'),
        });

        const apiDestTargetPolicy = new PolicyStatement({
            actions: ['events:InvokeApiDestination'],
            resources: [`arn:aws:events:${Aws.REGION}:${Aws.ACCOUNT_ID}:api-destination/*`],
        });

        this.apiDestTargetRole.addToPolicy(apiDestTargetPolicy);

        // Generic IAM role to Put to Evebt Bus Targets
        this.eventBusTargetRole = new Role(this, 'PutEventBusDestRole', {
            roleName: generateResourceName('EventBus-PutEventBusDestRole', props.suffix),
            assumedBy: new ServicePrincipal('events.amazonaws.com'),
        });

        const eventBusTargetPolicy = new PolicyStatement({
            actions: ['events:PutEvents'],
            resources: [`arn:aws:events:*:*:event-bus/*`],
            conditions: {
                StringEquals: {
                    'aws:PrincipalOrgID': 'o-hsfybe71id',
                },
            },
        });

        this.eventBusTargetRole.addToPolicy(eventBusTargetPolicy);

        // If deploying PROD environment
        if (props.suffix === '') {
            this.ddbTableReadRoleProd = new Role(this, `DDBTableReadRoleProd`, {
                assumedBy: new ArnPrincipal(props.eventEmailLambdaRoleArnNp),
                managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')],
            });
            this.applicationsTable.grantReadData(this.ddbTableReadRoleProd);
        }

        // Create DynamoDB table to store application data registed in Integration Hub
        this.eventFailuresTable = new Table(this, `EventFailuresTable${props.suffix}`, {
            partitionKey: {
                name: 'PK',
                type: AttributeType.STRING,
            },
            sortKey: {
                name: 'SK',
                type: AttributeType.STRING,
            },
            billingMode: BillingMode.PROVISIONED,
        });
        this._configureDDBAutoScaling(this.eventFailuresTable, props.ddbTableConfig);

        this.eventFailuresTable.addGlobalSecondaryIndex({
            indexName: 'EventFailuresTableIndexOnSubscriberApp',
            partitionKey: { name: 'SubscriberApp', type: AttributeType.STRING },
            sortKey: { name: 'EventTimestamp', type: AttributeType.STRING },
            projectionType: ProjectionType.ALL,
        });

        const indexName = 'EventFailuresTableIndexOnTimestamp';

        this.eventFailuresTable.addGlobalSecondaryIndex({
            indexName,
            partitionKey: { name: 'HourTimestamp', type: AttributeType.NUMBER },
            projectionType: ProjectionType.INCLUDE,
            nonKeyAttributes: ['SubscriberApp', 'SubscriptionId'],
        });

        this.emailDlqLambdaRole = new Role(this, `EmailDlqLambdaRole${props.suffix}`, {
            assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
            managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')],
            // for the lambda to assume role to the role in prod from non-prod and the cloud team role for email
            inlinePolicies: {
                assumeRolePolicy: new PolicyDocument({
                    statements: [
                        new PolicyStatement({
                            actions: ['sts:AssumeRole'],
                            resources: [props.sesRole, props.ddbTableReadRoleProdArn],
                        }),
                    ],
                }),
            },
        });

        this.s3TaggingLambdaRole = new Role(this, `S3TaggingLambdaRole${props.suffix}`, {
            assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
            managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')],
            // for the lambda to assume role to the role in prod from non-prod and the cloud team role for email
            inlinePolicies: {
                assumeRolePolicy: new PolicyDocument({
                    statements: [
                        new PolicyStatement({
                            actions: ['sts:AssumeRole'],
                            resources: [props.sesRole, props.ddbTableReadRoleProdArn],
                        }),
                    ],
                }),
            },
        });

        // Lambda to process SQS DLQ
        this.eventDLQLambda = new NodejsFunction(this, `EventDLQHandlerLambda${props.suffix}`, {
            functionName: generateResourceName('EventDLQHandlerLambda', props.suffix),
            entry: join(__dirname, '../../../../libs/lambdas/src/event-dlq/index.ts'),
            runtime: Runtime.NODEJS_18_X,
            environment: {
                DDB_DLQ_TABLE_NAME: this.eventFailuresTable.tableName,
                LOG_LEVEL: 'INFO',
            },
            memorySize: 1024,
            timeout: Duration.seconds(5),
            layers: [extLibLayer, powertoolsLayer],
            bundling: {
                externalModules: [
                    '@aws-lambda-powertools/logger',
                    '@aws-sdk/client-dynamodb',
                    '@aws-sdk/lib-dynamodb',
                    'luxon',
                    'zod',
                ],
            },
        });

        this.dlqNotificationLambda = new NodejsFunction(this, `EventDLQNotificationLambda${props.suffix}`, {
            functionName: generateResourceName('EventDLQNotificationLambda', props.suffix),
            entry: join(__dirname, '../../../../libs/lambdas/src/dlq-notification/index.ts'),
            runtime: Runtime.NODEJS_18_X,
            environment: {
                ASSUME_PROD_ROLE_ARN: props.ddbTableReadRoleProdArn,
                BROKER: props.suffix ? props.suffix : 'PRD',
                DDB_APPLICATIONS_TABLE_NAME: props.applicationsTableName,
                DDB_DLQ_TABLE_NAME: this.eventFailuresTable.tableName,
                DDB_DLQ_INDEX_NAME: indexName,
                // HACK: this should be replaced by an appropriate team email or distribution list
                INTEGRATION_TEAM_EMAIL: 'james.vandeven@woodside.com.au; rod.pattison@woodside.com.au',
                NODE_ENV: props.nodeEnv,
                SES_ROLE: props.sesRole,
                LOG_LEVEL: 'INFO',
            },
            role: this.emailDlqLambdaRole,
            memorySize: 1024,
            timeout: Duration.seconds(5),
            layers: [extLibLayer, powertoolsLayer],
            bundling: {
                loader: {
                    '.html': 'text',
                },
                externalModules: [
                    '@aws-lambda-powertools/logger',
                    '@aws-sdk/client-dynamodb',
                    '@aws-sdk/client-ses',
                    '@aws-sdk/client-sts',
                    '@aws-sdk/lib-dynamodb',
                    'class-validator',
                    'handlebars',
                    'luxon',
                    'zod',
                ],
            },
        });

        this.eventFailuresTable.grantReadWriteData(this.eventDLQLambda);
        this.eventFailuresTable.grantReadData(this.dlqNotificationLambda);
        this.applicationsTable.grantReadData(this.dlqNotificationLambda);

        this.s3TaggingLambda = new NodejsFunction(this, `S3TaggingLambda${props.suffix}`, {
            functionName: generateResourceName('S3TaggingLambda', props.suffix),
            entry: join(__dirname, '../../../../libs/lambdas/src/s3-tagging/index.ts'),
            runtime: Runtime.NODEJS_18_X,
            environment: {
                ASSUME_PROD_ROLE_ARN: props.ddbTableReadRoleProdArn,
                BROKER: props.suffix ? props.suffix : 'PRD',
                DDB_SCHEMAS_TABLE_NAME: props.schemasTableName,
                NODE_ENV: props.nodeEnv,
                LOG_LEVEL: 'INFO',
            },
            role: this.s3TaggingLambdaRole,
            memorySize: 1024,
            timeout: Duration.seconds(5),
            layers: [extLibLayer, powertoolsLayer],
            bundling: {
                externalModules: ['@aws-lambda-powertools/logger', 'zod'],
            },
        });

        this.schemasTable.grantReadData(this.s3TaggingLambda);
        this.eventBucket.addEventNotification(EventType.OBJECT_CREATED, new LambdaDestination(this.s3TaggingLambda));
        this.eventBucket.grantPut(this.s3TaggingLambda);

        // Setup a DLQ for catching failed events from rules
        this.eventBusDlq = new Queue(this, `EventTargetDLQ${props.suffix}`, {
            queueName: generateResourceName('EventBus-TargetDLQ', props.suffix),
            encryption: QueueEncryption.SQS_MANAGED,
        });

        // Grant permissions to allow any rule from the bus to sendMessages to the DLQ
        this.eventBusDlq.grantSendMessages(
            new ServicePrincipal('events.amazonaws.com', {
                conditions: {
                    ArnLike: {
                        'aws:SourceArn': `arn:aws:events:${Aws.REGION}:${Aws.ACCOUNT_ID}:rule/${this.eventBus.eventBusName}/*`,
                    },
                },
            }),
        );

        this.eventDLQLambda.addToRolePolicy(
            new PolicyStatement({
                actions: ['sqs:ReceiveMessage'],
                resources: [this.eventBusDlq.queueArn],
            }),
        );

        this.eventDLQLambda.addEventSource(
            new SqsEventSource(this.eventBusDlq, {
                batchSize: 10,
            }),
        );

        // new CfnOutput(this, 'EAIEventBrokerRegistryName', { value: this.schemaRegistry.registryName });
        new CfnOutput(this, 'EAIEventBrokerEventBusName', { value: this.eventBus.eventBusName });
        new CfnOutput(this, 'EAIEventBrokerS3BucketName', { value: this.eventBucket.bucketName });
        new CfnOutput(this, 'EAIEventBrokerDLQName', { value: this.eventBusDlq.queueName });
        new CfnOutput(this, 'EAIEventBrokerInvokeAPIDestinationRoleArn', { value: this.apiDestTargetRole.roleArn });
        new CfnOutput(this, 'EAIEventBrokerPutEventBusDestRoleArn', { value: this.eventBusTargetRole.roleArn });
        new CfnOutput(this, 'EAIEventFailuresTableName', { value: this.eventFailuresTable.tableName });

        this.emailSchedulerRole = new Role(this, `EmailSchedulerRole${props.suffix}`, {
            assumedBy: new ServicePrincipal('scheduler.amazonaws.com'),
        });

        const emailSchedulerPolicy = new PolicyStatement({
            actions: ['lambda:InvokeFunction'],
            resources: [this.dlqNotificationLambda.functionArn],
            effect: Effect.ALLOW,
        });

        this.emailSchedulerRole.addToPolicy(emailSchedulerPolicy);

        // HACK: there is an open issue on GitHub to implement the EventBridge Scheduler as an L2 construct, until then you must use `CfnResource`.
        // https://github.com/aws/aws-cdk-rfcs/pull/486
        this.emailScheduler = new CfnResource(this, `EmailScheduler${props.suffix}`, {
            type: 'AWS::Scheduler::Schedule',
            properties: {
                FlexibleTimeWindow: { Mode: 'OFF' },
                // Every hour at minute 5
                // https://docs.aws.amazon.com/scheduler/latest/UserGuide/schedule-types.html
                ScheduleExpression: 'cron(5 * * * ? *)',
                Target: {
                    Arn: this.dlqNotificationLambda.functionArn,
                    RoleArn: this.emailSchedulerRole.roleArn,
                },
                State: props.suffix === '' ? 'ENABLED' : 'DISABLED',
            },
        });
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
