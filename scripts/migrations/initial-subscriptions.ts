import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { EventBridge } from '@aws-sdk/client-eventbridge';
import { Application, BrokerTypes, Subscription, SubscriptionState } from '../../libs/interfaces/src';
import { has as _has } from 'lodash';

const EVENT_BUS_NAME = 'EAI-EventBus-PRD';
const EVENT_BUS_NAME_NP = 'EAI-EventBus-PRD-NP';
const DDB_APPLICATIONS_TABLE_NAME = 'EAI-EventApiStack-DEV-ApplicationsTable27AC2163-F20CVTUYO9NW';
// const DDB_APPLICATIONS_TABLE_NAME = 'EAI-EventApiStack-PRD-ApplicationsTable27AC2163-1QY3LP63MV5F9';
const DDB_SUBSCRIPTIONS_TABLE_NAME = 'EAI-EventApiStack-PRD-SubscriptionsTable40965A9D-PUQ1G78CUHUB';

const eb = new EventBridge({ region: 'ap-southeast-2' });
const db = DynamoDBDocument.from(new DynamoDB({ region: 'ap-southeast-2' }));

function getEventBusName(broker: BrokerTypes) {
    return broker === BrokerTypes.PRD ? EVENT_BUS_NAME : EVENT_BUS_NAME_NP;
}

function getSchemaDetails(eventPattern: string): string[] {
    // console.log('eventPattern', eventPattern);
    const pattern = JSON.parse(eventPattern);
    console.log('eventPattern', eventPattern);
    const version = _has(pattern, 'detail.Metadata.Version') ? pattern['detail']['Metadata']['Version'][0] : '0';
    return [`${pattern['source'][0]}@${pattern['detail-type'][0]}`, version];
}

async function main(broker: BrokerTypes) {
    // fetch a list of applications from db
    const appResult = await db.scan({ TableName: DDB_APPLICATIONS_TABLE_NAME });
    const applications = (appResult.Items as Application[])?.reduce((acc, cur: Application) => {
        return { ...acc, [cur.ShortName]: cur };
    }, {} as { [k: string]: Application });
    // console.log('applications', applications);

    // fetch a list of subscriptons from each broker
    const ruleResult = await eb.listRules({ EventBusName: getEventBusName(broker) });
    // console.log('found rules on ' + broker, JSON.stringify(ruleResult, null, 2));
    const rules = ruleResult.Rules!.filter((r) => {
        return (
            !r.Name?.startsWith('EAI-EventBroker-EventLoggerRule') &&
            !r.Name?.startsWith('Events-Archive-EAI-EventBus-PRD')
        );
    });

    const subscriptions: Subscription[] = [];
    for (const r of rules) {
        console.log('Processing rule: ' + r.Name);
        // get rule targes
        const appName = r.Name?.split('.')[0] as string;
        // console.log('appName', appName);
        const schema = getSchemaDetails(r.EventPattern as string);
        const subscription: Subscription = {
            Name: r.Name,
            RuleArn: r.Arn,
            Description: r.Description,
            EventBusName: r.EventBusName,
            RulePattern: r.EventPattern, // TODO: change RulePattern to EventPattern
            State: r.State as SubscriptionState,
            AppName: appName,
            AppCINumber: applications[appName]?.CINumber ?? 'unknown appName: ' + appName,
            CostCode: applications[appName]?.CostCode ?? 'unknown appName: ' + appName,
            OwnerRole: applications[appName]?.OwnerRole ?? 'unknown appName: ' + appName,
            SubscriptionOwner: applications[appName]?.ContactEmail ?? 'unknown appName: ' + appName,
            Broker: broker,
            SchemaName: schema[0],
            SchemaVersion: +schema[1],
            SubscribingDomain: '',
            Targets: [],
        };
        // const tags = await eb.listTagsForResource({ ResourceARN: r.Arn });
        // console.log('tags for rule' + r.Name, tags);
        const targetResult = await eb.listTargetsByRule({ Rule: r.Name, EventBusName: getEventBusName(broker) });
        // console.log('targets for rule' + r.Name, targetResult);
        for (const t of targetResult.Targets!) {
            subscription.Targets?.push(t.Arn!);
        }
        subscriptions.push(subscription);
        // write to db
        // await db.put({
        //     TableName: DDB_SUBSCRIPTIONS_TABLE_NAME,
        //     Item: {
        //         PK: subscription.Name,
        //         ...subscription,
        //     },
        // });
    }
    console.log('subscriptions', subscriptions);
}

(async () => {
    try {
        // NB, In PROD/QA, only run one at a time as they'll be across two accounts
        await main(BrokerTypes.NP);
        // await main(BrokerTypes.PRD);
    } catch (error) {
        console.error(error);
    } finally {
        console.log('finished');
    }
})();
