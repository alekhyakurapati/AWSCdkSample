import { Logger } from '@aws-lambda-powertools/logger';
import { LogLevel } from '@aws-lambda-powertools/logger/lib/types';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { SQSEvent, SQSRecord } from 'aws-lambda';
import { DateTime } from 'luxon';
import { z } from 'zod';

const logLevel = (process.env.LOG_LEVEL as LogLevel) ?? 'INFO';
const logger = new Logger({ serviceName: 'eventDLQ', logLevel });

export const handler = async (event: SQSEvent) => {
    /**
     * Initialising variables and settings
     */
    logger.info('SQS event', { event });
    const dlqTableName = process.env.DDB_DLQ_TABLE_NAME;
    if (!dlqTableName) {
        throw new Error('Environment variables failed to initialise');
    }

    if (event.Records.length > 25) {
        throw new Error(
            `SQS batch size exceeds Dynamo batch write operation, received: ${event.Records.length} events`,
        );
    }

    const eventFailures = parseRecords(event.Records);
    let batchWriteItems: Record<string, unknown>[] = eventFailures.map((failure) => ({
        PutRequest: { Item: failure },
    }));

    try {
        const ddbClient = new DynamoDB({
            region: 'ap-southeast-2',
        });
        const ddbDoc = DynamoDBDocument.from(ddbClient);

        do {
            const ddbResult = await ddbDoc.batchWrite({
                RequestItems: {
                    [dlqTableName]: batchWriteItems,
                },
            });

            if (ddbResult.UnprocessedItems?.[dlqTableName]) {
                batchWriteItems = ddbResult.UnprocessedItems[dlqTableName];
                logger.info('Retrying batchWrite, unprocessed items remaining:', { batchWriteItems });
            } else {
                logger.info('DynamoDB Put Result: ', ddbResult);
                batchWriteItems = [];
            }
        } while (batchWriteItems.length > 0);
    } catch (err: unknown) {
        logger.error('Error writing failed events to table');
        logger.error(`There may be unprocessed items: ${batchWriteItems}`);
        throw err;
    }
};

const eventSchema = z.object({
    source: z.string(),
    'detail-type': z.string(),
    id: z.string(),
    time: z.string(),
});

export const parseRecords = (records: SQSRecord[]) => {
    // Map from (SQSRecord + Event body) -> EventFailure (ready for DB batch write)
    return records.map(
        ({
            attributes: { ApproximateFirstReceiveTimestamp, ApproximateReceiveCount, SenderId, SentTimestamp },
            body,
            eventSourceARN,
            messageAttributes: { ERROR_CODE, ERROR_MESSAGE, RETRY_ATTEMPTS, RULE_ARN, TARGET_ARN },
            messageId,
        }) => {
            const ruleArn = RULE_ARN.stringValue;
            const targetArn = TARGET_ARN?.stringValue;
            if (!ruleArn || !targetArn) throw new Error('Missing ARN(s) from event');

            const ruleName = getRuleNameFromArn(ruleArn);
            const targetName = getTargetNameFromArn(targetArn);
            const subscriberApp = ruleName.split('.')[0] ?? '';

            const sentTimeMiliseconds = Number.parseInt(SentTimestamp);
            const sentTime = DateTime.fromMillis(sentTimeMiliseconds);
            const sentTimeString = sentTime.toUTC().toISO();
            const TTL = sentTime.plus({ days: 60 }).startOf('second').toSeconds();
            const hourTime = sentTime.startOf('hour').toSeconds();

            logger.debug('raw string:', body);
            logger.debug('json parsing:', JSON.parse(body));

            const {
                'detail-type': detailType,
                id: EventId,
                source,
                time: EventTimestamp,
            } = eventSchema.parse(JSON.parse(body));
            const EventName = `${source}@${detailType}`;

            return {
                PK: `ERR#${ruleName}#${targetName}`,
                SK: `#${sentTimeString}`,
                Attributes: {
                    ApproximateFirstReceiveTimestamp,
                    ApproximateReceiveCount,
                    SenderId,
                },
                Body: body,
                ErrorCode: ERROR_CODE?.stringValue ?? '',
                ErrorMessage: ERROR_MESSAGE?.stringValue ?? '',
                EventId,
                EventName,
                EventTimestamp,
                HourTimestamp: hourTime,
                MessageId: messageId,
                RetryAttempts: RETRY_ATTEMPTS?.stringValue ?? 0,
                RuleArn: ruleArn,
                SentTimestamp: sentTimeString,
                SourceArn: eventSourceARN,
                SubscriberApp: subscriberApp,
                SubscriptionId: ruleName,
                TTL,
                TargetArn: targetArn,
            };
        },
    );
};

export const getRuleNameFromArn = (arnName: string | undefined) => {
    const ruleRegExp =
        /^arn:aws[\w-]*:events:[a-z]{2}-[a-z]+-[\w-]+:[0-9]{12}:[a-zA-Z-]+\/[.\-_A-Za-z0-9]+(\/(?<ruleName>[a-zA-Z.0-9-]+))?/;

    const result = ruleRegExp.exec(arnName ?? '');
    let ruleName = '';
    if (result && result.groups) {
        ruleName = result.groups.ruleName;
    }
    return ruleName;
};

export const getTargetNameFromArn = (arnName: string | undefined) => {
    const ruleRegExp =
        /^arn:aws[\w-]*:events:[a-z]{2}-[a-z]+-[\w-]+:[0-9]{12}:[a-zA-Z-]+\/(?<TargetEvent>[.\-_A-Za-z0-9]+)/;

    const result = ruleRegExp.exec(arnName ?? '');
    let targetName = '';
    if (result && result.groups) {
        targetName = result.groups.TargetEvent;
    }
    return targetName;
};
