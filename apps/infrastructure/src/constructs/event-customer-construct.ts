import { CorsHttpMethod } from '@aws-cdk/aws-apigatewayv2-alpha';
import { Duration, Stack } from 'aws-cdk-lib';
import {
    AuthorizationType,
    EndpointType,
    LambdaIntegration,
    LogGroupLogDestination,
    MethodOptions,
    MockIntegration,
    PassthroughBehavior,
    RestApi,
    TokenAuthorizer,
} from 'aws-cdk-lib/aws-apigateway';
import { LayerVersion, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { LogGroup } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { join } from 'path';
import { generateResourceName } from '../utils';

export interface CustomerApiProps {
    customerApiLambda: NodejsFunction;
    customerClientId: string;
    suffix?: string;
}

export class CustomerApi extends Construct {
    authorizerLambda: NodejsFunction;
    restApiGw: RestApi;

    constructor(scope: Construct, id: string, props: CustomerApiProps) {
        super(scope, id);

        const powertoolsLayer = LayerVersion.fromLayerVersionArn(
            this,
            'PowertoolsLayer',
            `arn:aws:lambda:${Stack.of(this).region}:094274105915:layer:AWSLambdaPowertoolsTypeScript:9`,
        );

        // TODO: move into stack and pass into construct. Only need to create 1 authoriser, not one for each no/prd
        this.authorizerLambda = new NodejsFunction(this, 'AuthorizeLambda-' + props.suffix, {
            functionName: generateResourceName('EventCustomerApi-Authorizer', props.suffix),
            description: `Lambda Authorizer for ${generateResourceName('CustomerApiGW', props.suffix)}`,
            memorySize: 512,
            timeout: Duration.seconds(5),
            runtime: Runtime.NODEJS_18_X,
            entry: join(__dirname, '../../../../libs/lambdas/src/authorizer/auth.ts'),
            environment: {
                AUDIENCE: props.customerClientId,
                LOG_LEVEL: 'ERROR',
            },
            layers: [powertoolsLayer],
            bundling: { externalModules: ['@aws-lambda-powertools/logger'] },
        });

        const apiLog = new LogGroup(this, `CustomerApiGwAccessLogs${props.suffix}`);

        this.restApiGw = new RestApi(this, `CustomerApiGW${props.suffix}`, {
            restApiName: generateResourceName('EventCustomerApi-CustomerApiGW', props.suffix),
            description: 'Integration Platform Customer REST API Gateway',
            defaultCorsPreflightOptions: {
                allowOrigins: ['*'],
                allowMethods: [CorsHttpMethod.GET, CorsHttpMethod.POST, CorsHttpMethod.OPTIONS],
                allowHeaders: ['*'],
            },

            deployOptions: {
                accessLogDestination: new LogGroupLogDestination(apiLog),
                stageName: 'v1',
            },
            endpointTypes: [EndpointType.REGIONAL],
        });

        this.restApiGw.root.addMethod;
        const events = this.restApiGw.root.addResource('events');
        const options: MethodOptions = {
            authorizationType: AuthorizationType.CUSTOM,
            authorizer: new TokenAuthorizer(this, `EventCustomerAuthorizer${props.suffix}`, {
                handler: this.authorizerLambda,
            }),
            // authorizationType: AuthorizationType.NONE,
        };

        events.addMethod('GET', new LambdaIntegration(props.customerApiLambda), options);
        events.addMethod('POST', new LambdaIntegration(props.customerApiLambda), options);

        this.restApiGw.root.addResource('{proxy+}').addMethod(
            'ANY',
            new MockIntegration({
                passthroughBehavior: PassthroughBehavior.NEVER,
                requestTemplates: {
                    'application/json': `{"statusCode": 404}`,
                },
                integrationResponses: [
                    {
                        statusCode: '404',
                        responseTemplates: {
                            'application/json': `
                                {
                                "statusCode": 404,
                                "message":"Requested resource/method is not supported",
                                "error": "Not Found"
                                }
                            `,
                        },
                    },
                ],
            }),
            {
                methodResponses: [{ statusCode: '404' }],
            },
        );
    }
}
