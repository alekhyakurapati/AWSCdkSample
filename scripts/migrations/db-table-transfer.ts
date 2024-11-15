import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument, ScanCommandOutput } from '@aws-sdk/lib-dynamodb';

const ddbDoc = DynamoDBDocument.from(new DynamoDB({ region: 'ap-southeast-2' }));

//FROM
// DDB_APPLICATIONS_TABLE_NAME=EAI-EventApiStack-DEV-ApplicationsTable27AC2163-F20CVTUYO9NW
// DDB_DOMAINS_TABLE_NAME=EAI-EventApiStack-DEV-BusinessDomainTableACA77767-1WDMAIQJP4NH0
// DDB_EVENT_STORE_TABLE_NAME=EAI-EventApiStack-DEV-EventSourcingTable71A000C5-12DY7ZEDS9IS0
// DDB_SCHEMAS_TABLE_NAME=EAI-EventApiStack-DEV-SchemasTable1DC069C3-KAMMLOX2S61X
// DDB_SUBSCRIPTIONS_TABLE_NAME=EAI-EventApiStack-DEV-SubscriptionsTable40965A9D-ZWMR3ODHC65R

//TO
// DDB_APPLICATIONS_TABLE_NAME=EAI-EventApiStack-DEV-ApplicationsTable27AC2163-12DYC8XX6DEPE
// DDB_DOMAINS_TABLE_NAME=EAI-EventApiStack-DEV-BusinessDomainTableACA77767-1LHKFCN44G0CN
// DDB_EVENT_STORE_TABLE_NAME=EAI-EventApiStack-DEV-EventSourcingTable71A000C5-VZR5TG6P6J5
// DDB_SCHEMAS_TABLE_NAME=EAI-EventApiStack-DEV-SchemasTable1DC069C3-1U951BW2YKRFI
// DDB_SUBSCRIPTIONS_TABLE_NAME=EAI-EventApiStack-DEV-SubscriptionsTable40965A9D-14W3MN4TEM8QL

const FROM_TABLE_NAME = 'EAI-EventApiStack-DEV-SubscriptionsTable40965A9D-ZWMR3ODHC65R';
const TO_TABLE_NAME = 'EAI-EventApiStack-DEV-SubscriptionsTable40965A9D-14W3MN4TEM8QL';

async function main() {
    let result: ScanCommandOutput;
    let exclusiveStartKey: Record<string, any> | undefined = undefined;

    do {
        console.log(`Fetching from: ${FROM_TABLE_NAME} from start key: ${exclusiveStartKey}`);
        result = await ddbDoc.scan({
            TableName: FROM_TABLE_NAME,
            ExclusiveStartKey: exclusiveStartKey,
        });

        await Promise.all(
            result.Items!.map((item) => {
                // do any transformation here
                // return the put command promise
                return ddbDoc.put({
                    TableName: TO_TABLE_NAME,
                    Item: item,
                });
            }),
        );
    } while (result.LastEvaluatedKey);
}

(async () => {
    try {
        await main();
    } catch (error) {
        console.error(error);
    } finally {
        console.log('finished');
    }
})();
