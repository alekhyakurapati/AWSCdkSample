import { CfnOutput, Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Code, LayerVersion, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { join } from 'path';
import { CustomerApi } from '../constructs/event-customer-construct';
import { generateResourceName } from '../utils';

export interface EventCustomerApiProps extends StackProps {
    customerClientIdNp: string;
    customerClientId: string;
    eventBucketName: string;
    eventBucketNameNp: string;
    eventBusArn: string;
    eventBusArnNp: string;
    internalApiUrl: string;
    internalApiUrlNp: string;
    externalApiUrl: string;
    externalApiUrlNp: string;
}

export class EventCustomerApiStack extends Stack {
    customerApiLambda: NodejsFunction;
    customerApiGwNP: CustomerApi;
    customerApiGwPRD: CustomerApi;
    // authorizerLambda: NodejsFunction;
    // restApiGw: RestApi;

    constructor(scope: Construct, id: string, props: EventCustomerApiProps) {
        super(scope, id, props);

        const eventBusArn = props.eventBusArn;
        const eventBusArnNp = props.eventBusArnNp;

        const layerSdk = new LayerVersion(this, 'ProxySdkLambdaLayer', {
            compatibleRuntimes: [Runtime.NODEJS_18_X],
            layerVersionName: generateResourceName('EventApi-ProxySdkLambdaLayer'),
            code: Code.fromAsset(join(__dirname, '../../resources/lambda-layers/aws-sdk')),
            description: 'Includes AWS-SDK v3',
        });

        const powertoolsLayer = LayerVersion.fromLayerVersionArn(
            this,
            'PowertoolsLayer',
            `arn:aws:lambda:${Stack.of(this).region}:094274105915:layer:AWSLambdaPowertoolsTypeScript:9`,
        );

        this.customerApiLambda = new NodejsFunction(this, 'CustomerApiLambda', {
            functionName: generateResourceName('EventCustomerApi-CustomerApiLambda'),
            description: `Lambda handler for Customer API /events endpoint`,
            memorySize: 1024,
            timeout: Duration.seconds(5),
            runtime: Runtime.NODEJS_18_X,
            handler: 'default',
            entry: join(__dirname, '../../../../libs/lambdas/src/customer-api/index.ts'),
            environment: {
                BUCKET_NAME: props.eventBucketName,
                BUCKET_NAME_NP: props.eventBucketNameNp,
                EVENT_BUS_ARN: eventBusArn,
                EVENT_BUS_ARN_NP: eventBusArnNp,
                INTERNAL_API_URL: props.internalApiUrl,
                INTERNAL_API_URL_NP: props.internalApiUrlNp,
                EXTERNAL_API_URL: props.externalApiUrl,
                EXTERNAL_API_URL_NP: props.externalApiUrlNp,
            },
            layers: [layerSdk, powertoolsLayer],
            bundling: {
                externalModules: ['@aws-sdk/client-eventbridge', '@aws-sdk/client-s3', '@aws-lambda-powertools/logger'],
            },
        });

        this.customerApiLambda.addToRolePolicy(
            new PolicyStatement({
                effect: Effect.ALLOW,
                actions: ['events:PutEvents'],
                resources: [eventBusArn, eventBusArnNp],
            }),
        );

        this.customerApiLambda.addToRolePolicy(
            new PolicyStatement({
                effect: Effect.ALLOW,
                actions: ['s3:PutObject', 's3:PutObjectAcl', 's3:GetObject', 's3:GetObjectAcl', 's3:ListBucket'],
                resources: [
                    `arn:aws:s3:::${props.eventBucketName}`,
                    `arn:aws:s3:::${props.eventBucketName}/*`,
                    `arn:aws:s3:::${props.eventBucketNameNp}`,
                    `arn:aws:s3:::${props.eventBucketNameNp}/*`,
                ],
            }),
        );

        // non prod
        this.customerApiGwNP = new CustomerApi(this, `CustomerApi-NP`, {
            customerApiLambda: this.customerApiLambda,
            customerClientId: props.customerClientIdNp,
            suffix: 'NP',
        });

        // prod
        this.customerApiGwPRD = new CustomerApi(this, `CustomerApi`, {
            customerApiLambda: this.customerApiLambda,
            customerClientId: props.customerClientId,
            suffix: '',
        });

        // Add the API Ids to the Lambda Env Vars
        this.customerApiLambda.addEnvironment('CUSTOMER_API_ID_NP', this.customerApiGwNP.restApiGw.restApiId);
        this.customerApiLambda.addEnvironment('CUSTOMER_API_ID', this.customerApiGwPRD.restApiGw.restApiId);

        new CfnOutput(this, 'EAICustomerEventApiGwEndpointNP', { value: `${this.customerApiGwNP.restApiGw.url}` });
        new CfnOutput(this, 'EAICustomerEventApiGwEndpointPRD', { value: `${this.customerApiGwPRD.restApiGw.url}` });

        // const apiLog = new LogGroup(this, 'CustomerApiGwAccessLogs');

        // this.restApiGw = new RestApi(this, 'CustomerApiGW', {
        //     restApiName: generateResourceName('EventCustomerApi-CustomerApiGW'),
        //     description: 'Integration Platform Customer REST API Gateway',
        //     defaultCorsPreflightOptions: {
        //         allowOrigins: ['*'],
        //         allowMethods: [CorsHttpMethod.GET, CorsHttpMethod.POST, CorsHttpMethod.OPTIONS],
        //         allowHeaders: ['*'],
        //     },

        //     deployOptions: {
        //         accessLogDestination: new LogGroupLogDestination(apiLog),
        //         stageName: 'v1',
        //     },
        //     endpointTypes: [EndpointType.REGIONAL],
        // });

        // this.restApiGw.root.addMethod;
        // const events = this.restApiGw.root.addResource('events');
        // const authorizer: MethodOptions = {
        //     authorizationType: AuthorizationType.CUSTOM,
        //     authorizer: new TokenAuthorizer(this, 'EventCustomerAuthorizer', {
        //         handler: this.authorizerLambda,
        //     }),
        // };
        // events.addMethod('GET', new LambdaIntegration(this.customerApiLambda), authorizer);
        // events.addMethod('POST', new LambdaIntegration(this.customerApiLambda), authorizer);

        // this.restApiGw.root.addResource('{proxy+}').addMethod(
        //     'ANY',
        //     new MockIntegration({
        //         passthroughBehavior: PassthroughBehavior.NEVER,
        //         requestTemplates: {
        //             'application/json': `{"statusCode": 404}`,
        //         },
        //         integrationResponses: [
        //             {
        //                 statusCode: '404',
        //                 responseTemplates: {
        //                     'application/json': `
        //                         {
        //                         "statusCode": 404,
        //                         "message":"Cannot GET requested resource",
        //                         "error": "Not Found"
        //                         }
        //                     `,
        //                 },
        //             },
        //         ],
        //     }),
        //     {
        //         methodResponses: [{ statusCode: '404' }],
        //     },
        // );
    }
}
