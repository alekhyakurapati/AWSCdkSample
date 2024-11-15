import { Construct } from 'constructs';
import { RemovalPolicy, CfnOutput, Aws } from 'aws-cdk-lib';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { EventBus, Rule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { WebSocketLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import { WebSocketApi, WebSocketStage } from '@aws-cdk/aws-apigatewayv2-alpha';
import { generateResourceName } from '../utils';
import { join } from 'path';

export interface EventBridgeWebSocketProps {
    readonly eventBusName: string;
    readonly commonLambdaProps: NodejsFunctionProps;
}

export class EventBridgeWebSocket extends Construct {
    constructor(scope: Construct, id: string, config: EventBridgeWebSocketProps) {
        super(scope, id);

        /**
         * API Gateway (Websocket API)
         */
        const api = new WebSocketApi(this, generateResourceName('PortalWebsocket'), {
            description: 'Integration Platform Portal Websocket',
        });

        /**
         * Table to manage connections
         */
        const table = new Table(this, `ConnectionsTable`, {
            partitionKey: {
                name: 'connectionId',
                type: AttributeType.STRING,
            },
            readCapacity: 1,
            writeCapacity: 1,
            removalPolicy: RemovalPolicy.DESTROY,
        });

        /**
         * Websocket lambdas
         */
        const onConnectLambda = new NodejsFunction(this, 'OnConnectLambda', {
            ...config.commonLambdaProps,
            environment: {
                TABLE_NAME: table.tableName,
            },
            entry: join(__dirname, '../../../../apps/lambdas/src/websockets/on-connect.ts'),
        });

        const onDisconnectLambda = new NodejsFunction(this, 'OnDisconnectLambda', {
            ...config.commonLambdaProps,
            environment: {
                TABLE_NAME: table.tableName,
            },
            entry: join(__dirname, '../../../../apps/lambdas/src/websockets/on-disconnect.ts'),
        });

        const eventBridgeBrokerLambda = new NodejsFunction(this, 'EventBridgeBrokerLambda', {
            ...config.commonLambdaProps,
            initialPolicy: [
                new PolicyStatement({
                    actions: ['execute-api:ManageConnections'],
                    resources: [`arn:aws:execute-api:${Aws.REGION}:${Aws.ACCOUNT_ID}:${api.apiId}/*`],
                    effect: Effect.ALLOW,
                }),
            ],
            environment: {
                TABLE_NAME: table.tableName,
                WEBSOCKET_API: `${api.apiEndpoint}/v1`,
            },
            entry: join(__dirname, '../../../../apps/lambdas/src/websockets/eventbridge-broker.ts'),
        });

        table.grantReadWriteData(onConnectLambda);
        table.grantReadWriteData(onDisconnectLambda);
        table.grantReadWriteData(eventBridgeBrokerLambda);

        // create routes for API Gateway
        api.addRoute('$connect', {
            integration: new WebSocketLambdaIntegration('OnConnectIntegration', onConnectLambda),
        });
        api.addRoute('$disconnect', {
            integration: new WebSocketLambdaIntegration('OnDisconnectIntegration', onDisconnectLambda),
        });

        new WebSocketStage(this, 'PortalWsStage', {
            autoDeploy: true,
            stageName: 'v1',
            webSocketApi: api,
        });

        // Event rule for event-broker-lambda
        const eventBus = EventBus.fromEventBusName(this, 'EventBus', config.eventBusName);
        new Rule(this, 'PortalWebsocketsRule', {
            eventBus: eventBus,
            description: 'Subscribes to all wel.digital.integration* events for the portal websocket',
            eventPattern: {
                source: ['wel.digital.integration'],
            },
            targets: [new LambdaFunction(eventBridgeBrokerLambda)],
        });

        new CfnOutput(this, 'Websocket endpoint', { value: `${api.apiEndpoint}/v1` });
    }
}
