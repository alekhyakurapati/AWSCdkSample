import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument, ScanCommandOutput } from '@aws-sdk/lib-dynamodb';
import { Subscription, Version } from '../../../libs/interfaces/src';

const ddbDoc = DynamoDBDocument.from(new DynamoDB({ region: 'ap-southeast-2' }));

const FROM_TABLE_NAME = '';
const TO_TABLE_NAME = '';

async function main() {
    let result: ScanCommandOutput;
    let exclusiveStartKey: Record<string, any> | undefined = undefined;

    do {
        console.log('Fetching from: ', exclusiveStartKey);
        result = await ddbDoc.scan({
            TableName: FROM_TABLE_NAME,
            ExclusiveStartKey: exclusiveStartKey,
            // KeyConditionExpression: '#PK = :PK AND begins_with ( #SK, :SK)',
            ExpressionAttributeNames: { '#SK': 'SK' },
            ExpressionAttributeValues: {
                ':SK': 'SUB#',
            },
            FilterExpression: 'begins_with ( #SK, :SK)',
        });

        await Promise.all(
            result.Items!.map((item: Subscription) => {
                // do any transformation here
                // console.log('old', item.RulePattern);
                const rule = JSON.parse(item.RulePattern!);
                rule.detail.Metadata.Version = [`${rule.detail.Metadata.Version}`];
                item.RulePattern = JSON.stringify(rule, null, 4);
                // console.log('new', item.RulePattern);
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
