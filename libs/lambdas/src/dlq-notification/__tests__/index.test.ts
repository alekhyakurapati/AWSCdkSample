import { AssumeRoleCommand, STSClient } from '@aws-sdk/client-sts';
import { DynamoDBDocumentClient, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import * as dlqNotification from '../index';
import { getDeliveryFailures, handler } from '../index';
import * as sesEmail from '../ses-email';

jest.mock('../source.html', () => 'html');
const envVars = process.env;

const mockEventA = {
    PK: 'EventA',
    SK: '',
    SubscriberApp: 'App1',
    SubscriptionId: 'SubX',
};

const mockEventB = {
    PK: 'EventB',
    SK: '',
    SubscriberApp: 'App1',
    SubscriptionId: 'SubX',
};

const mockEventC = {
    PK: 'EventC',
    SK: '',
    SubscriberApp: 'App1',
    SubscriptionId: 'SubY',
};

const mockEventD = {
    PK: 'EventD',
    SK: '',
    SubscriberApp: 'App2',
    SubscriptionId: 'SubY',
};

const sameSubEvents = [mockEventA, mockEventB];
const sameAppEvents = [mockEventA, mockEventB, mockEventC];
const allMockEvents = [mockEventA, mockEventB, mockEventC, mockEventD];

describe('Testing fetching failed events', () => {
    const eventFailuresMock = mockClient(DynamoDBDocumentClient);

    beforeEach(() => {
        process.env = envVars;
        eventFailuresMock.reset();
    });

    it('Throws error on DB failures', async () => {
        eventFailuresMock.rejects();

        try {
            await getDeliveryFailures();
        } catch (err) {
            expect(err).toBeInstanceOf(Error);
        }
    });

    it('Throws validation error when item attributes are missing', async () => {
        eventFailuresMock.on(QueryCommand).resolves({ Items: [{ unknownKey: 'weird value' }] });
        try {
            await getDeliveryFailures();
        } catch (err) {
            if (!(err instanceof Error)) {
                throw new Error('Encountered unknown error');
            }

            expect(err.message).toEqual(expect.stringContaining('invalid_type'));
        }
    });

    it('Returns an array of objects when well formed', async () => {
        eventFailuresMock.on(QueryCommand).resolves({ Items: allMockEvents });

        expect(await getDeliveryFailures()).toEqual(allMockEvents);
    });

    it('Handles paginated queries', async () => {
        eventFailuresMock
            .on(QueryCommand)
            .resolvesOnce({
                Items: [mockEventA],
                LastEvaluatedKey: { key: 1 },
            })
            .resolvesOnce({
                Items: [mockEventB],
                LastEvaluatedKey: { key: 2 },
            })
            .resolvesOnce({
                Items: [mockEventC],
                LastEvaluatedKey: { key: 3 },
            })
            .resolves({ Items: [mockEventD], LastEvaluatedKey: undefined });

        expect(await getDeliveryFailures()).toEqual(allMockEvents);
    });
});

describe('Testing DLQ email notifications', () => {
    const dbMock = mockClient(DynamoDBDocumentClient);
    const fetchFailuresSpy = jest.spyOn(dlqNotification, 'getDeliveryFailures');
    const sesSpy = jest.spyOn(sesEmail, 'sesSendEmail');
    const stsMock = mockClient(STSClient);
    stsMock.on(AssumeRoleCommand).resolves({
        Credentials: {
            AccessKeyId: '',
            SecretAccessKey: '',
            SessionToken: '',
            Expiration: new Date(),
        },
    });

    beforeEach(() => {
        process.env = envVars;
        dbMock.reset();
        fetchFailuresSpy.mockReset();
        sesSpy.mockReset();
    });

    it('Throws an error if env vars are not present', async () => {
        process.env = {}; // Clear environment variables
        try {
            await handler();
        } catch (err: unknown) {
            if (!(err instanceof Error)) {
                throw new Error('Encountered unknown error');
            }

            expect(err).toBeInstanceOf(Error);
        }
    });

    it('Correctly propagates errors when failing to fetch events', async () => {
        fetchFailuresSpy.mockImplementation(() => {
            throw new Error('Error querying event failures...');
        });

        try {
            await handler();
        } catch (err) {
            expect(err).toBeInstanceOf(Error);
        }

        fetchFailuresSpy.mockRestore();
    });

    it('Does not send emails when no events are found', async () => {
        dbMock.on(QueryCommand).resolves({ Items: [] });

        await handler();

        expect(sesSpy).toHaveBeenCalledTimes(0);
    });

    it('Sends one email when all events are for same subscription and application', async () => {
        dbMock
            .on(QueryCommand)
            .resolves({ Items: sameSubEvents })
            .on(ScanCommand)
            .resolves({ Items: [{ PK: 'App1', Name: '', SupportEmail: [''] }] });

        sesSpy.mockImplementation(async () => ({ MessageId: '', $metadata: {} }));

        await handler();

        expect(sesSpy).toHaveBeenCalledTimes(1);
    });

    it('Sends one email when all events are for same application', async () => {
        dbMock
            .on(QueryCommand)
            .resolves({ Items: sameAppEvents })
            .on(ScanCommand)
            .resolves({ Items: [{ PK: 'App1', Name: '', SupportEmail: [''] }] });

        sesSpy.mockImplementation(async () => ({ MessageId: '', $metadata: {} }));

        await handler();

        expect(sesSpy).toHaveBeenCalledTimes(1);
    });

    it('Sends multiple emails when events are for different applications', async () => {
        dbMock
            .on(QueryCommand)
            .resolves({ Items: allMockEvents })
            .on(ScanCommand)
            .resolves({
                Items: [
                    { PK: 'App1', Name: '', SupportEmail: [''] },
                    { PK: 'App2', Name: '', SupportEmail: [''] },
                ],
            });

        sesSpy.mockImplementation(async () => ({ MessageId: '', $metadata: {} }));

        await handler();

        expect(sesSpy).toHaveBeenCalledTimes(2);
    });
});
