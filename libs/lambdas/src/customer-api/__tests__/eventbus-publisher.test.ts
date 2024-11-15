import { EventBridge, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { mockClient } from 'aws-sdk-client-mock';
import { eventBusPublisher } from '../eventbus-publisher';

const eventBusMock = mockClient(EventBridge);

/*
    Detail type , Detail and Source are already checked for empty data and undefined in request-handler.
*/
describe('Test for Eventbus publisher lambda', function () {
    let requestBody: any;

    beforeEach(() => {
        process.env.EVENT_BUS_ARN = 'arn:aws:events:ap-southeast-2:727026770742:event-bus/EAI-EventBus-DEV';
        requestBody = {
            Detail: {
                Metadata: {
                    Guid: 'UNIT-TEST-b2ae5042-1647-4fe8-9a31-cf46a4763a4c',
                    Time: 1637819678749,
                    Version: '1',
                    StatusChange: 'SCHD',
                    SequenceNumber: '507',
                    BusinessKey: '004100335021',
                    ChangedDate: '20220930',
                    ChangeTime: '000000',
                },
                Data: {
                    _link: 'https://wel-eai-event-bucket-as-np.s3.ap-southeast-2.amazonaws.com/wel.test2/testEventNoFlag/UNIT-TEST-b2ae5042-1647-4fe8-9a31-cf46a4763a4c.json',
                },
            },
        };
    });

    it('Produces error message with empty requestBody for eventbus', async () => {
        requestBody = {};
        await expect(eventBusPublisher(requestBody)).rejects.toThrowError();
    });

    // Eventbridge will send a 200 response even if some events fail to get processed.
    it('Produces error message if source is not valid', async () => {
        const mockResponse = {
            $metadata: {
                httpStatusCode: 200,
                requestId: '81a1e90f-c34b-419e-81be-ffedd0c4844c',
                attempts: 1,
                totalRetryDelay: 0,
            },
            Entries: [
                {
                    ErrorCode: 'InvalidArgument',
                    ErrorMessage: 'Parameter Source is not valid. Reason: Source is a required argument.',
                },
            ],
            FailedEntryCount: 1,
        };
        eventBusMock.on(PutEventsCommand).resolves(mockResponse);
        await expect(eventBusPublisher(requestBody)).rejects.toThrowError(
            'Parameter Source is not valid. Reason: Source is a required argument.',
        );
    });

    it('Can publish data to Eventbridge', async () => {
        const mockResponse = {
            $metadata: {
                httpStatusCode: 200,
                requestId: '31dddf1b-8d9b-4aa2-a5b9-f67fc1929b96',
                attempts: 1,
                totalRetryDelay: 0,
            },
            Entries: [
                {
                    EventId: '504e9d6d-89a2-b0f7-e05f-2fde3f730f13',
                },
            ],
            FailedEntryCount: 0,
        };

        const mockResult = {
            EventId: '504e9d6d-89a2-b0f7-e05f-2fde3f730f13',
        };

        eventBusMock.on(PutEventsCommand).resolves(mockResponse);
        const result = await eventBusPublisher(requestBody);
        expect(result).toEqual(mockResult);
    });
});
