import { DynamoDB, ProvisionedThroughputExceededException } from '@aws-sdk/client-dynamodb';
import { ScanCommandInput, DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DateTime } from 'luxon';
import promptly from 'promptly';
import { z } from 'zod';

const MAX_RETRIES = 10;
const ddbDoc = DynamoDBDocument.from(new DynamoDB({ region: 'ap-southeast-2' }));

const defaultTable = 'EAI-EventBrokerStack-JVDV-NP-EventFailuresTableNP152B99E6-11EQE1WAZSDA5';

const eventFailureSchema = z.object({
    SK: z.preprocess((input: string) => input.split('#')[1], z.string().datetime({ offset: true })),
});

type EventFailure = z.infer<typeof eventFailureSchema>;

const scanBatchWriteBackoff = async (scanParams: ScanCommandInput, backoffMs: number, retries: number) => {
    const results: EventFailure[] = [];
    try {
        do {
            const scanResult = await ddbDoc.scan(scanParams);
            console.log('Consumed capacity:', scanResult.ConsumedCapacity.CapacityUnits);

            if (scanResult.Items.length > 0) {
                await batchWriteBackoff(scanParams.TableName, scanResult.Items, backoffMs, 0);
            }

            scanParams.ExclusiveStartKey = scanResult.LastEvaluatedKey;
        } while (scanParams.ExclusiveStartKey !== undefined);

        return results;
    } catch (err) {
        if (err instanceof ProvisionedThroughputExceededException) {
            console.log(`Throughput exceeded, retrying in ${backoffMs}ms...`);
            await new Promise((resolve) => setTimeout(resolve, backoffMs));
            const nextBackoff = backoffMs * 2;
            const nextRetries = retries + 1;
            if (nextRetries >= MAX_RETRIES) {
                throw new Error(`Failed after ${nextRetries} retries`);
            }
            return scanBatchWriteBackoff(scanParams, nextBackoff, nextRetries);
        } else {
            console.error('Encountered error during scan operation');
            throw err;
        }
    }
};

const batchWriteBackoff = async (tableName: string, items: EventFailure[], backoffMs: number, retries: number) => {
    try {
        const putRequests = items
            .filter((item) => {
                const result = eventFailureSchema.safeParse(item);
                if (result.success === false) {
                    console.debug(item);
                    console.error(result.error);
                }

                return result.success;
            })
            .map((item) => {
                try {
                    const TTL = z.number().parse(ttlFromTimestamp(item.SK));

                    return {
                        PutRequest: {
                            Item: { ...item, TTL },
                        },
                    };
                } catch (err: unknown) {
                    console.error(err);
                }
            });

        if (putRequests.length === 0) {
            console.error('No valid items retrieved from DB');
            return;
        }

        const result = await ddbDoc.batchWrite({
            RequestItems: {
                [tableName]: putRequests,
            },
        });

        if (result.UnprocessedItems[tableName]) {
            await batchWriteBackoff(
                tableName,
                (result.UnprocessedItems[tableName] ?? []) as EventFailure[],
                backoffMs,
                0,
            );
        }
    } catch (err: unknown) {
        if (err instanceof ProvisionedThroughputExceededException) {
            console.log(`Throughput exceeded, retrying in ${backoffMs}ms...`);
            await new Promise((resolve) => setTimeout(resolve, backoffMs));
            const nextBackoff = backoffMs * 2;
            const nextRetries = retries + 1;
            if (nextRetries >= MAX_RETRIES) {
                throw new Error(`Failed after ${nextRetries} retries`);
            }
            await batchWriteBackoff(tableName, items, nextBackoff, nextRetries);
        } else {
            console.error('Encountered error during batchWrite operation');
            throw err;
        }
    }
};

export const updateTTL = async () => {
    console.log('Update TTL in event failures table');

    if (!(await promptly.confirm('Are you signed in to the correct AWS workload?'))) return;

    const eventFailuresTable = await promptly.prompt(`Which table to populate? (${defaultTable})`, {
        default: defaultTable,
    });

    const scanParams: ScanCommandInput = {
        TableName: eventFailuresTable,
        ExclusiveStartKey: undefined,
        ReturnConsumedCapacity: 'TOTAL',
        Limit: 25,
    };

    scanBatchWriteBackoff(scanParams, 1000, 0)
        .then((result: unknown) => console.log(result))
        .catch((err: unknown) => console.error(err));
};

const ttlFromTimestamp = (SK: string) => {
    const sentTimestamp = SK.split('#')[1];

    return Math.floor(DateTime.fromISO(sentTimestamp).plus({ days: 60 }).toSeconds());
};
