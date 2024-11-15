import { Construct } from 'constructs';
import { Duration, Aws } from 'aws-cdk-lib';
import { generateResourceName } from '../utils';
import { join } from 'path';
import { ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { EventBus, CfnRule } from 'aws-cdk-lib/aws-events';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { ILayerVersion, LayerVersion, Runtime } from 'aws-cdk-lib/aws-lambda';

export interface EventLoggerProps {
    eventBus: EventBus;
    suffix?: string;
    extLibLayer: LayerVersion;
    powertoolsLayer: ILayerVersion;
}

export class EventLogger extends Construct {
    constructor(scope: Construct, id: string, props: EventLoggerProps) {
        super(scope, id);

        // create the lambdas
        const loggerLambda = new NodejsFunction(this, `EventLogger${props.suffix}`, {
            functionName: generateResourceName('EventBroker-EventLogger', props.suffix),
            entry: join(__dirname, '../../../../libs/lambdas/src/event-logger/event-logger.ts'),
            runtime: Runtime.NODEJS_18_X,
            environment: {
                EVENTBUS_NAME: props.eventBus.eventBusName,
                LOG_LEVEL: 'DEBUG',
            },
            layers: [props.extLibLayer, props.powertoolsLayer],
            memorySize: 1024,
            timeout: Duration.seconds(5),
            bundling: {
                externalModules: ['@aws-lambda-powertools/logger'],
            },
        });

        /**
         * add an eventbridge rule to invoke the subscriber function
         */
        // (using CFN because L2 constructors (events.Rule) doesn't allow prefix expressions)
        const eventRule = new CfnRule(this, `EventLoggerRule${props.suffix}`, {
            name: generateResourceName('EventBroker-EventLoggerRule', props.suffix),
            eventBusName: props.eventBus.eventBusName,
            description: 'Rule matching all events with a source: wel.*',
            eventPattern: {
                source: [{ prefix: 'wel.' }],
            },
            targets: [
                {
                    id: `EventLogger${props.suffix}`,
                    arn: loggerLambda.functionArn,
                },
            ],
        });

        // Add a Resource-based policy to allow the eventbridge rule to invoke the subscriber function
        loggerLambda.addPermission(`EventBroker-EventLoggerRuleAllowInvoke${props.suffix}`, {
            principal: new ServicePrincipal('events.amazonaws.com'),
            sourceArn: eventRule.attrArn,
            sourceAccount: Aws.ACCOUNT_ID,
        });
    }
}
