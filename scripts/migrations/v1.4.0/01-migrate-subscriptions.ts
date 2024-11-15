import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument, ScanCommandOutput } from '@aws-sdk/lib-dynamodb';

const ddbDoc = DynamoDBDocument.from(new DynamoDB({ region: 'ap-southeast-2' }));

const FROM_TABLE_NAME = '';
const TO_TABLE_NAME = '';

async function main() {
    let result: ScanCommandOutput;
    let exclusiveStartKey: Record<string, any> | undefined = undefined;

    do {
        console.log('Fetching from: ', FROM_TABLE_NAME, exclusiveStartKey);
        result = await ddbDoc.scan({
            TableName: FROM_TABLE_NAME,
            ExclusiveStartKey: exclusiveStartKey,
        });

        if (result.Items) {
            const transformed = result.Items.map((item) => {
                return {
                    ...item,
                    PK: `SUB#${item.PK}`,
                    SK: `SUB#${item.PK}`,
                    SchemaVersion: `${item.SchemaVersion}`,
                    Type: 'Subscription',
                };
            });
            // console.log(transformed);
            await saveItems(transformed);
        }
    } while (result.LastEvaluatedKey);
}

async function saveItems(items: Record<string, any>[]) {
    await Promise.all(
        items.map((item) => {
            // do any transformation here
            // return the put command promise
            return ddbDoc.put({
                TableName: TO_TABLE_NAME,
                Item: item,
            });
        }),
    );
}

(async () => {
    console.log('Starting');
    const start = Date.now();
    try {
        await main();
    } catch (error) {
        console.error(error);
    } finally {
        console.log('Finished');
        const end = Date.now();
        console.log('Start time: ' + new Date(start).toISOString());
        console.log('End time  : ' + new Date(end).toISOString());
        console.log('Time (s)  : ' + (end - start) / 1000);
    }
})();
