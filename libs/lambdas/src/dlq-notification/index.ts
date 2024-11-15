import { Logger } from '@aws-lambda-powertools/logger';
import { LogLevel } from '@aws-lambda-powertools/logger/lib/types';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument, QueryCommandInput, ScanCommandInput } from '@aws-sdk/lib-dynamodb';
import { compile } from 'handlebars';
import { DateTime } from 'luxon';
import { z } from 'zod';
import { setDynamoDbClient } from '../utils';
import { sesSendEmail } from './ses-email';
import template from './source.html';

const logLevel = (process.env.LOG_LEVEL as LogLevel) ?? 'INFO';
export const logger = new Logger({ serviceName: 'dlqNotification', logLevel });

const envSchema = z.object({
    ASSUME_PROD_ROLE_ARN: z.string().nonempty().optional(),
    BROKER: z.string().nonempty(),
    DDB_APPLICATIONS_TABLE_NAME: z.string().nonempty(),
    DDB_DLQ_TABLE_NAME: z.string().nonempty(),
    DDB_DLQ_INDEX_NAME: z.string().nonempty(),
    NODE_ENV: z.string().nonempty(),
    SES_ROLE: z.string().nonempty(),
});

const ENV = envSchema.parse(process.env);

export const handler = async () => {
    // Only required when going from np workload into prd workload
    if (ENV.BROKER === 'NP' && !ENV.ASSUME_PROD_ROLE_ARN) {
        throw new Error("Missing 'ASSUME_PROD_ROLE_ARN' environment variable");
    }

    const apps = await getSupportEmails(failuresToApps(await getDeliveryFailures()));
    logger.debug('Apps with failures in last hour:', { apps });

    const emailCompiler = compile(template);

    const sentEmails = await Promise.allSettled(
        apps.map(async ({ subscriberApp, subscriptions, failedEventsCount, supportEmails }) => {
            logger.debug(`Sending email to ${subscriberApp}: ${supportEmails}`);
            const data = {
                subscriberApp,
                failedEventsCount,
                subscriptions: Array.from(subscriptions.values()).join(', '),
            };

            const emailData = emailCompiler(data);

            try {
                return await sesSendEmail(ENV.SES_ROLE, emailData, supportEmails, subscriberApp);
            } catch (err: unknown) {
                logger.error(`Error sending event failure email to ${subscriberApp} (${supportEmails})`);
                logger.error(err instanceof Error ? err.message : 'Encountered unknown error');
                throw err;
            }
        }),
    );

    if (sentEmails.some((promise) => promise.status === 'rejected')) {
        throw new Error('Encountered error sending notification emails');
    }
};

const failedEventSchema = z.object({
    PK: z.string(),
    SK: z.string(),
    SubscriberApp: z.string(),
    SubscriptionId: z.string(),
});

type DeliveryFailure = z.infer<typeof failedEventSchema>;

const eventsParser = z.array(failedEventSchema);

export const getDeliveryFailures = async () => {
    const ddbDoc = DynamoDBDocument.from(new DynamoDB({ region: 'ap-southeast-2' }));

    const events: DeliveryFailure[] = [];
    let exclusiveStartKey = undefined;

    const hourTimestamp = DateTime.now().startOf('hour').minus({ hours: 1 });
    const hourTimestampSeconds = hourTimestamp.toSeconds();

    logger.info(
        `Fetching failures with timestamp: ${hourTimestampSeconds} ('${hourTimestamp.toISO()}' - '${hourTimestamp
            .plus({ hours: 1 })
            .toISO()}')`,
    );

    do {
        const queryCommand: QueryCommandInput = {
            TableName: ENV.DDB_DLQ_TABLE_NAME,
            IndexName: ENV.DDB_DLQ_INDEX_NAME,
            ExclusiveStartKey: exclusiveStartKey,
            KeyConditionExpression: 'HourTimestamp = :hourTimestamp',
            ExpressionAttributeValues: {
                ':hourTimestamp': hourTimestampSeconds,
            },
        };

        try {
            const result = await ddbDoc.query(queryCommand);
            const parsedEvents = eventsParser.parse(result.Items);
            events.push(...parsedEvents);

            exclusiveStartKey = result.LastEvaluatedKey;
        } catch (error: unknown) {
            logger.error('Error querying event failures table');
            throw error;
        }
    } while (exclusiveStartKey);

    return events;
};

type AppWithFailingSubscriptions = {
    shortName: string;
    subscriptions: Set<string>;
    failedEventsCount: number;
};

const failuresToApps = (recentFailures: DeliveryFailure[]) => {
    // Reduction collects all failing subscriptions by app
    return recentFailures.reduce<Record<string, AppWithFailingSubscriptions>>(
        (acc, { SubscriberApp, SubscriptionId }) => {
            const app: AppWithFailingSubscriptions = acc[SubscriberApp] ?? {
                shortName: SubscriberApp,
                subscriptions: new Set(),
                failedEventsCount: 0,
            };

            app.subscriptions.add(SubscriptionId);
            app.failedEventsCount += 1;

            return { ...acc, [SubscriberApp]: app };
        },
        {},
    );
};

const appDetailsSchema = z.object({
    PK: z.string(),
    Name: z.string(),
    SupportEmail: z.array(z.string()),
});
type AppDetails = z.infer<typeof appDetailsSchema>;

export const getSupportEmails = async (apps: Record<string, AppWithFailingSubscriptions>) => {
    if (Object.keys(apps).length === 0) return [];

    logger.debug('[getSupportEmails]');

    const ddbClient = await setDynamoDbClient();
    const ddbParams: ScanCommandInput = {
        TableName: ENV.DDB_APPLICATIONS_TABLE_NAME,
        ExclusiveStartKey: undefined,
    };
    const allAppDetails: Record<string, AppDetails> = {};

    try {
        do {
            const items = await ddbClient.scan(ddbParams);
            items.Items?.map((item) => appDetailsSchema.parse(item)).forEach(
                (item) => (allAppDetails[item.PK] = { ...item }),
            );
            ddbParams.ExclusiveStartKey = items.LastEvaluatedKey;
        } while (ddbParams.ExclusiveStartKey !== undefined);
    } catch (err: unknown) {
        logger.error(
            err instanceof Error
                ? `Could not access details from Applications table: ${err.message}`
                : 'Encountered unknown error trying to access application details',
        );
        throw err;
    }

    return Object.values(apps).map((app) => {
        const currDetails = allAppDetails[app.shortName];

        if (currDetails === undefined) {
            throw new Error(`No matching details found for ${app.shortName}`);
        }

        return {
            ...app,
            subscriberApp: currDetails.Name,
            supportEmails: currDetails.SupportEmail,
        };
    });
};
