import { Logger } from '@aws-lambda-powertools/logger';
import { LogLevel } from '@aws-lambda-powertools/logger/lib/types';
import { S3 } from '@aws-sdk/client-s3';
import { QueryCommandInput } from '@aws-sdk/lib-dynamodb';
import { S3Event } from 'aws-lambda';
import { z } from 'zod';
import { setDynamoDbClient } from '../utils';

const envSchema = z.object({
    ASSUME_PROD_ROLE_ARN: process.env.BROKER === 'NP' ? z.string() : z.undefined(),
    BROKER: z.string(),
    DDB_SCHEMAS_TABLE_NAME: z.string(),
    NODE_ENV: z.string(),
    LOG_LEVEL: z.string(),
});

const schemaSchema = z.object({
    AppCINumber: z.string(),
    AppName: z.string(),
    CostCode: z.string(),
});

const ENV = envSchema.parse(process.env);

const logLevel = (process.env.LOG_LEVEL as LogLevel) ?? 'INFO';
const logger = new Logger({ serviceName: 'eventDLQ', logLevel });

export const handler = async ({ Records }: S3Event) => {
    const event = Records.at(0).s3;
    logger.info('S3 Event', { event });

    const { bucket, object } = event;
    const [eventSource, eventName] = object.key.split('/');
    const schemaName = `SCH#${eventSource}@${eventName}`;

    const queryCmd: QueryCommandInput = {
        TableName: ENV.DDB_SCHEMAS_TABLE_NAME,
        KeyConditionExpression: '#PK = :pk and #SK = :sk',
        ExpressionAttributeNames: { '#PK': 'PK', '#SK': 'SK' },
        ExpressionAttributeValues: { ':pk': schemaName, ':sk': schemaName },
    };

    const ddbClient = await setDynamoDbClient();
    const s3 = new S3({ region: 'ap-southeast-2' });

    try {
        const items = await ddbClient.query(queryCmd);
        const { AppCINumber, AppName, CostCode } = schemaSchema.parse(items.Items.at(0));

        if (!AppName) {
            throw new Error(`No 'AppName' found for ${schemaName}`);
        }

        if (!AppCINumber || !CostCode) {
            console.error(`Values missing for S3 tag creation on ${schemaName}`);
        }

        const result = await s3.putObjectTagging({
            Bucket: bucket.name,
            Key: object.key,
            Tagging: {
                TagSet: [
                    { Key: 'cmdb:AppCode', Value: AppCINumber ?? `MISSING CI Number: ${AppName}` },
                    { Key: 'cmdb:AppName', Value: AppName },
                    { Key: 'CostCode', Value: CostCode ?? `MISSING CostCode: ${AppName}` },
                ],
            },
        });

        logger.debug('S3 Object Tagged', { result });
    } catch (err: unknown) {
        logger.error(
            err instanceof Error ? err.message : 'Encountered unknown error trying to access application details',
            { err },
        );
        throw err;
    }
};
