import { App } from 'aws-cdk-lib';

import { generateResourceName, getContext, getEnvVars } from './utils';

import { EventBrokerStack } from './stacks/event-broker.stack';
import { EventApiStack } from './stacks/event-api.stack';
// import { PortalApiStack } from './stacks/portal-api.stack';
import { SchemaRegistryStack } from './stacks/schema-registry.stack';
import { EventCustomerApiStack } from './stacks/event-customer-api.stack';

const app = new App();

const context = getContext(app);

const { ACCOUNT, REGION } = getEnvVars();

const brokerStack = new EventBrokerStack(app, 'EventBrokerStack', {
    stackName: generateResourceName('EventBrokerStack'),
    description: 'Cloudformation stack for Integration Platform Event Broker',
    env: { account: ACCOUNT, region: REGION },
    eventBusArn: context.eventBusArn,
    eventEmailLambdaRoleArnNp: context.eventEmailLambdaRoleArnNp,
    eventBucketName: context.eventBucketName,
    suffix: '',
    ddbTableConfig: context.ddbTableConfig,
    applicationsTableName: context.applicationsTableName,
    subscriptionsTableName: context.subscriptionsTableName,
    schemasTableName: context.schemasTableName,
    sesRole: context.sesRole,
    nodeEnv: context.nodeEnv || 'development',
});

const brokerStackNp = new EventBrokerStack(app, 'EventBrokerStackNp', {
    stackName: generateResourceName('EventBrokerStack', 'NP'),
    description: 'Cloudformation stack for Integration Platform NonProd Event Broker',
    env: { account: ACCOUNT, region: REGION },
    eventBusArn: context.eventBusArnNp,
    eventEmailLambdaRoleArnNp: context.eventEmailLambdaRoleArnNp,
    ddbTableReadRoleProdArn: context.ddbTableReadRoleProdArn,
    eventBucketName: context.eventBucketNameNp,
    suffix: 'NP',
    ddbTableConfig: context.ddbTableConfig,
    applicationsTableName: context.applicationsTableName,
    subscriptionsTableName: context.subscriptionsTableName,
    schemasTableName: context.schemasTableName,
    sesRole: context.sesRole,
    nodeEnv: context.nodeEnv || 'development',
});

const schemaRegistryStack = new SchemaRegistryStack(app, 'SchemaRegistryStack', {
    stackName: generateResourceName('SchemaRegistryStack'),
    description: 'Cloudformation stack for Integration Platform Schema Registry',
    env: { account: ACCOUNT, region: REGION },
});

const eventApiStack = new EventApiStack(app, 'EventApiStack', {
    stackName: generateResourceName('EventApiStack'),
    description: 'Cloudformation stack for Integration Platform Event API',
    env: { account: ACCOUNT, region: REGION },
    nodeEnv: context.nodeEnv || 'development',
    assumeNpRoleArn: context.assumeNpRoleArn,
    eventBusArn: context.eventBusArn,
    eventBusArnNp: context.eventBusArnNp,
    dlqArn: context.eventDlqArn,
    dlqArnNp: context.eventDlqArnNp,
    invokeApiDestRoleArn: context.invokeApiDestRoleArn,
    invokeApiDestRoleArnNp: context.invokeApiDestRoleArnNp,
    putEventBusDestRoleArn: context.putEventBusDestRoleArn,
    putEventBusDestRoleArnNp: context.putEventBusDestRoleArnNp,
    schemaRegistryName: schemaRegistryStack.schemaRegistry.registryName,
    portalClientId: context.portalClientId,
    ddbTableConfig: context.ddbTableConfig,
    eventFailuresTableNameNP: context.eventFailuresTableNameNP,
    eventFailuresTableNamePRD: context.eventFailuresTableNamePRD,
});

const eventCustomerApiStack = new EventCustomerApiStack(app, 'EventCustomerApiStack', {
    stackName: generateResourceName('EventCustomerApiStack'),
    description: 'Cloudformation stack for Integration Platform Customer Event API',
    env: { account: ACCOUNT, region: REGION },
    customerClientId: context.customerClientId,
    customerClientIdNp: context.customerClientIdNp,
    eventBucketName: context.eventBucketName,
    eventBucketNameNp: context.eventBucketNameNp,
    eventBusArn: context.eventBusArn,
    eventBusArnNp: context.eventBusArnNp,
    internalApiUrl: context.internalApiUrl,
    internalApiUrlNp: context.internalApiUrlNp,
    externalApiUrl: context.externalApiUrl,
    externalApiUrlNp: context.externalApiUrlNp,
});

// const portalApiStack = new PortalApiStack(app, 'PortalApiStack', {
//     stackName: generateResourceName('PortalApiStack'),
//     description: 'Cloudformation stack for Integration Platform Portal API',
//     env: { account: ACCOUNT, region: REGION },
//     secretsManagerName: context.secretsManagerName,
//     portalClientId: context.portalClientId,
// });
