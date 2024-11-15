import { Logger } from '@aws-lambda-powertools/logger';
import { LogLevel } from '@aws-lambda-powertools/logger/lib/types';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { AssumeRoleCommand, STS } from '@aws-sdk/client-sts';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { BrokerTypes } from '@eai-event-integration-platform/interfaces';
import { z } from 'zod';

const logLevel = (process.env.LOG_LEVEL as LogLevel) ?? 'INFO';
export const logger = new Logger({ serviceName: 'crossAccountDynamoClient', logLevel });

const envSchema = z.object({
    ASSUME_PROD_ROLE_ARN: process.env.BROKER === 'NP' ? z.string() : z.undefined(),
    BROKER: z.string().nonempty(),
    NODE_ENV: z.string().nonempty(),
});

const ENV = envSchema.parse(process.env);

export const setDynamoDbClient = async () => {
    logger.debug('[setDynamoDbClient]');

    const nodeEnv = ENV.NODE_ENV;
    const broker = ENV.BROKER;

    logger.debug(`broker data in check env', ${nodeEnv}, ${broker}, 'broker check:', ${broker == BrokerTypes.NP}`);

    // Only QA and PROD environments have a stack deployed across accounts
    return (nodeEnv === 'production' || nodeEnv === 'qa') && broker === BrokerTypes.NP
        ? await setProdDynamoDbClient() // nonProd broker being requested, need to assume new role for non-prod aws account
        : DynamoDBDocument.from(new DynamoDB({ region: 'ap-southeast-2' }));
};

const setProdDynamoDbClient = async () => {
    logger.debug('[setProdDynamoDbClient]');

    try {
        // get the credentials to assume role in the NP account
        const sts = new STS({ region: 'ap-southeast-2' });
        const stsParams = {
            RoleArn: ENV.ASSUME_PROD_ROLE_ARN,
            RoleSessionName: 'prod-role',
        };

        const prodAcc = await sts.send(new AssumeRoleCommand(stsParams));
        if (!prodAcc.Credentials) {
            throw new Error('Could not assume prod role');
        }

        const credentials = {
            accessKeyId: prodAcc.Credentials.AccessKeyId ?? '',
            secretAccessKey: prodAcc.Credentials.SecretAccessKey ?? '',
            sessionToken: prodAcc.Credentials.SessionToken ?? '',
        };

        return DynamoDBDocument.from(
            new DynamoDB({
                region: 'ap-southeast-2',
                credentials,
            }),
        );
    } catch (error: unknown) {
        logger.error(
            error instanceof Error
                ? `Error trying to set DynamoDbClient to assume Prod Role: ${error.message}`
                : 'Encountered unknown error',
        );
        throw error;
    }
};
