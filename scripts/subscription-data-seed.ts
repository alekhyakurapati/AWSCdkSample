import { AppModule } from '../apps/api/src/app/app.module';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { EventBridge } from '@aws-sdk/client-eventbridge';
import { Schemas, CreateSchemaCommandInput } from '@aws-sdk/client-schemas';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { faker } from '@faker-js/faker';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Request } from 'express';
import { capitalize } from 'lodash';
import { CreateSubscriptionDto } from '../libs/api/subscriptions/src/lib/dto';
import { SubscriptionsService } from '../libs/api/subscriptions/src/lib/subscriptions.service';
import { BrokerTypes, Subscription, SubscriptionState } from '../libs/interfaces/src';

const DDB_SUBSCRIPTIONS_TABLE_NAME = 'EAI-EventApiStack-RP-SubscriptionsTable40965A9D-2U3NZ93LWKFV';

// const injRequest = { user: { roles: ['Event.User.SAP'] } } as any;
// const injConfig = new ConfigService({ DDB_SUBSCRIPTIONS_TABLE_NAME: DDB_SUBSCRIPTIONS_TABLE_NAME });
// const injEb = new EventBridge({ region: 'ap-southeast-2' });
// const injDdb = DynamoDBDocument.from(new DynamoDB({ region: 'ap-southeast-2' }));
// const subscriptionsService = new SubscriptionsService(injRequest, injConfig, injEb, injDdb);

const schemaNames = [
    'wel.corporate.finance@QuarterlyReportGenerated',
    'wel.corporate.people@UserCreated',
    // 'wel.corporate.people@UserOnboarded',
    // 'wel.corporate.people@UserPositionChanged',
    'wel.digital.integration@EventSchemaCreated',
    // 'wel.digital.integration@EventSchemaUpdated',
    // 'wel.digital.integration@EventSchemaDeleted',
    // 'wel.digital.integration@EventSubscriptionCreated',
    // 'wel.digital.integration@EventSubscriptionUpdated',
    // 'wel.digital.integration@EventSubscriptionDeleted',
    'wel.digital.science@SignificantEvent',
    'wel.operations.logistics@PartsOrdered',
    'wel.operations.engineering@TankPressureHigh',
    'wel.operations.hse.moc@Issue',
    'wel.operations.hse.moc@Issuelink',
    'wel.operations.hse.moc@IssueStatusChange',
    'wel.operations.hse.oper@Issue',
    'wel.operations.hse.oper@Issuelink',
    'wel.operations.hse.oper@IssueStatusChange',
    'wel.operations.maintenance@WorkOrderStatusChange',
    // 'wel.operations.maintenance@WorkOrderChanged',
];
const domains = [
    'wel.climate-strategy.carbon',
    'wel.corporate-legal.business-climate-energy-outlook',
    'wel.corporate-legal.corporate-change-management',
    'wel.corporate-legal.corporate-affairs',
    'wel.corporate-legal.global-property-workplace',
    'wel.corporate-legal.hse',
    'wel.corporate-legal.internal-audit',
    'wel.corporate-legal.leadership-commitment-accountability',
    'wel.corporate-legal.legal-secretariat',
    'wel.corporate-legal.risk-quality-compliance-governance',
    'wel.corporate-legal.security-emergency-management',
    'wel.development.development-planning',
    'wel.development.drilling-completions',
    'wel.development.power-new-market',
    'wel.development.projects',
    'wel.development.quality-assurance',
    'wel.marketing-trading.shipping-operations',
    'wel.finance-commercial.commercial',
    'wel.finance-commercial.contract-procurement',
    'wel.finance-commercial.finance',
    'wel.finance-commercial.investor-relations',
    'wel.finance-commercial.performance-excellence',
    'wel.finance-commercial.strategy-planning-analysis',
    'wel.finance-commercial.tax',
    'wel.finance-commercial.treasury',
    'wel.operations.maintenance',
    'wel.operations.logistics.aviation',
    'wel.operations.logistics.marine-services',
    'wel.operations.logistics.materials-management',
    'wel.operations.logistics.facility-management',
    'wel.operations.production.operations',
    'wel.operations.production.planning',
    'wel.operations.production.hc-accounting',
    'wel.operations.production.integrated-activity-planning',
    'wel.operations.reservoir-management',
    'wel.operations.subsea-pipelines',
    'wel.operations.quality-sample-analysis',
    'wel.operations.global-operations-planning-performance',
    'wel.engineering',
    'wel.human-resource-management',
    'wel.new-energy.hydrogen',
    'wel.information-system-management',
    'wel.exploration.geoscience',
    'wel.exploration.subsurface',
];

const targetArns = {
    NP: [
        'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-NP',
        'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-NP1',
        'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-NP2',
    ],
    PRD: ['arn:aws:events:ap-southeast-2:981408407928:event-bus/EAI-SubscriberTestEventBus-PRD'],
};

// const result = subscriptionsService.create({
//     SchemaName: 'wel.corporate.peopleandglobalcapability@LeaveStatusChange',
//     SchemaVersion: '1',
//     Description: 'test rule',
//     Targets: ['arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-NP'],
//     RulePattern:
//         '{"source":["wel.corporate.peopleandglobalcapability"],"detail-type":["LeaveStatusChange"],"detail":{"Metadata":{"Version":["1"]}}}',
//     CostCode: 'COST-CODE-01',
//     AppName: 'SAP',
//     AppCINumber: 'CITest01',
//     SubscriptionOwner: 'Test',
//     SubscribingDomain: 'wel.operations.maintenance',
//     OwnerRole: 'Event.User.SAP',
//     Broker: BrokerTypes.NP,
//     State: SubscriptionState.ENABLED,
// });

const results = {
    success: <string[]>[],
    failed: <string[]>[],
};

function generateSubscriptionDto(schemaName: string): CreateSubscriptionDto {
    // const schemaName = faker.helpers.arrayElement(schemaNames);
    const [domain, eventName] = schemaName.split('@');
    const broker = faker.helpers.arrayElement([BrokerTypes.PRD, BrokerTypes.NP]);
    const service = faker.helpers.arrayElement(['SAP', 'JIRA', 'FUSE', 'SAR']);

    const subscription: CreateSubscriptionDto = new CreateSubscriptionDto();
    subscription.SchemaName = schemaName;
    subscription.SchemaVersion = '1';
    subscription.Targets = faker.helpers.arrayElements(targetArns[broker], faker.datatype.number({ min: 1, max: 3 }));
    subscription.Description = faker.lorem.words(5);
    subscription.RulePattern = `{"source":["${domain}"],"detail-type":["${eventName}"],"detail":{"Metadata":{"Version":["${subscription.SchemaVersion}"]}}}`;
    subscription.Broker = broker;
    subscription.OwnerRole = `Event.User.${service}`;
    subscription.SubscriptionOwner = faker.name.findName();
    subscription.SubscribingDomain = faker.helpers.arrayElement(domains);
    subscription.AppName = service;
    subscription.AppCINumber = `CI${faker.datatype.number({ min: 1000, max: 1999 })}`;
    subscription.CostCode = `${faker.datatype.number({ min: 20000, max: 30000 })}`;
    subscription.State = SubscriptionState.ENABLED;

    return subscription;
}

async function createSubscription(schemaName: string) {
    console.log('Creating new subscription for: ', schemaName);

    const subscriptionDto = generateSubscriptionDto(schemaName);
    console.log('subscriptionDto', subscriptionDto);
    // try {
    //     const subscription = await subscriptionsService.create(subscriptionDto);
    //     results.success.push(subscription);
    // } catch (error) {
    //     console.error('Error creating schema for: ' + schemaName, error, subscriptionDto);
    //     results.failed.push(schemaName);
    // }
}

// schemaNames.forEach(async (name) => saveSchema(name));

// Promise.all(promises)
//   .then((result) => console.log('result', result))
//   .catch((err) => console.error(err));

async function run() {
    const app = await NestFactory.createApplicationContext(AppModule);
    // application logic...

    console.warn(`Running script on ${DDB_SUBSCRIPTIONS_TABLE_NAME} ddb table`);
    try {
        let i = 0;
        while (i < 10) {
            const schemaName = faker.helpers.arrayElement(schemaNames);
            await createSubscription(schemaName);

            i++;
        }
    } catch (e) {
        // Deal with the fact the chain failed
    }
    console.log('Results: ', results);
}
run();
