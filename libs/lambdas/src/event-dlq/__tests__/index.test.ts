import { ProvisionedThroughputExceededException } from '@aws-sdk/client-dynamodb';
import { BatchWriteCommand, BatchWriteCommandOutput, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { SQSRecord } from 'aws-lambda';
import { mockClient } from 'aws-sdk-client-mock';
import { getRuleNameFromArn, getTargetNameFromArn, handler, parseRecords } from '../index';

describe('Testing getRuleNameFromArn', () => {
    it('Returns an empty string when passed undefined', () => {
        expect(getRuleNameFromArn(undefined)).toEqual('');
    });

    it('Returns an empty string when passed garbage', () => {
        expect(getRuleNameFromArn('garbage')).toEqual('');
    });

    it('Returns a valid rule name when passed an arn', () => {
        expect(
            getRuleNameFromArn(
                'arn:aws:events:ap-southeast-2:144028967590:rule/EAI-EventBus-PRD/IDMS.maintenance.MaintenanceOrderChanged.p46ur',
            ),
        ).toEqual('IDMS.maintenance.MaintenanceOrderChanged.p46ur');
    });
});

describe('Testing getTargetNameFromArn', () => {
    it('Returns an empty string when passed undefined', () => {
        expect(getTargetNameFromArn(undefined)).toEqual('');
    });

    it('Returns an empty string when passed garbage', () => {
        expect(getTargetNameFromArn('garbage')).toEqual('');
    });

    it('Returns a valid rule name when passed an arn', () => {
        expect(
            getTargetNameFromArn(
                'arn:aws:events:ap-southeast-2:144028967590:rule/EAI-EventBus-PRD/IDMS.maintenance.MaintenanceOrderChanged.p46ur',
            ),
        ).toEqual('EAI-EventBus-PRD');
    });
});

describe('Testing parseRecords', () => {
    it('Returns empty array when passed empty array', () => {
        expect(parseRecords([])).toEqual([]);
    });

    it('Throws an error if the body is malformed', () => {
        const failingInvocation = () => parseRecords(missingBody);
        expect(failingInvocation).toThrow(SyntaxError);
    });

    it('Returns expected object when passed valid input', () => {
        expect(parseRecords(validRecord)).toEqual(validEventFailure);
    });
});

describe('Testing handler', () => {
    // const ddbClient = new DynamoDBClient({});
    // const ddbDoc = DynamoDBDocument.from(ddbClient);

    const ddbMock = mockClient(DynamoDBDocumentClient);

    beforeEach(() => {
        ddbMock.reset();
    });

    it('Throws an error if event batch size is too large', async () => {
        try {
            await handler({ Records: tooManyRecords });
        } catch (err: unknown) {
            if (!(err instanceof Error)) {
                throw new Error('Encountered unknown error');
            }

            expect(err.message).toMatch('SQS batch size exceeds Dynamo batch write operation, received: 30 events');
        }
    });

    it('Throws an error if batchWrite exceeds throughput', async () => {
        const exceptionOptions = {
            name: 'ProvisionedThroughputExceededException',
            message: 'ProvisionedThroughputExceededException',
            $metadata: {},
        };
        ddbMock.on(BatchWriteCommand).rejects(new ProvisionedThroughputExceededException(exceptionOptions));

        try {
            await handler({ Records: validRecord });
        } catch (err) {
            if (!(err instanceof Error)) {
                throw new Error('Encountered unknown error');
            }

            expect(err).toBeInstanceOf(ProvisionedThroughputExceededException);
        }
    });

    it('Retrys batchWrite when operation returns unprocessed items', async () => {
        const dlqTable = process.env.DDB_DLQ_TABLE_NAME ?? '';
        const unprocessedItems: BatchWriteCommandOutput = {
            UnprocessedItems: {
                [dlqTable]: [
                    {
                        PutRequest: {
                            Item: {
                                ...validEventFailure,
                            },
                        },
                    },
                ],
            },
            $metadata: {},
        };
        ddbMock.on(BatchWriteCommand).resolvesOnce(unprocessedItems).resolves({});
        await handler({ Records: validRecord });
        console.debug(ddbMock.calls());

        expect(ddbMock.calls().length).toBe(2);
    });
});

const missingBody: SQSRecord[] = [
    {
        messageId: '1fd50124-5b23-42b5-82e6-c680a4851d7b',
        receiptHandle:
            'AQEB/oia0uOYJEf0VSfYMr7s8A/VJOP3ghqZUZ3C1fnxLvYgFOW9WNCQxN3XQHOdcXnsch8PeasxnZI74isTGb74WhyApkx39NVUFYa6jaZfmPhHbfTR/ixY9aSSw3KH+hmmg++trL0OH5FdY6W3a+08gaThVYbUM6EqpjJyRun/imzXX/DyhuL2fjyNSWpmbydM9wyxbmbMGMItWBbmnfsUDpnqe0OZE/hMd0wGR8YqrEkTIVeRCOMhAb8WgGRA0sJTePUYYntUk6QPAymirs02Ww+yuis9QLpALvtt3R4+am8z0edGP4y2LJjVybLKt8F3SE5JHRUwhLXcxbKyyikIGsCU1PNzNA5fBFscT9GrDJw+zPgiQbsjPXb3Earq1WpU7w9+n1ApGAMofU/pq2R7f2Mn7j72Kpypj2QWr3+yx5U=',
        body: '',
        attributes: {
            ApproximateReceiveCount: '1',
            AWSTraceHeader: 'Root=1-642a96c0-5e11633418264c0307188401;Parent=2dbea8005c8c6d82;Sampled=0',
            SentTimestamp: '1680599454177',
            SenderId: 'AIDAIDYJ7RPI7CT46XWPK',
            ApproximateFirstReceiveTimestamp: '1680599454178',
        },
        messageAttributes: {
            RULE_ARN: {
                stringValue:
                    'arn:aws:events:ap-southeast-2:144028967590:rule/EAI-EventBus-PRD/IDMS.maintenance.MaintenanceOrderChanged.p46ur',
                stringListValues: [],
                binaryListValues: [],
                dataType: 'String',
            },
            TARGET_ARN: {
                stringValue:
                    'arn:aws:events:ap-southeast-2:144028967590:api-destination/IDMS.BECSRESTAPI.ApiDestination-PRD/7e08279e-244f-4443-a5f4-b9c262da4d81',
                stringListValues: [],
                binaryListValues: [],
                dataType: 'String',
            },
            ERROR_MESSAGE: {
                stringValue:
                    'Unable to invoke ApiDestination endpoint: Timeout calling endpoint for API Destination: socket closed.',
                stringListValues: [],
                binaryListValues: [],
                dataType: 'String',
            },
            EXHAUSTED_RETRY_CONDITION: {
                stringValue: 'MaximumEventAgeInSeconds',
                stringListValues: [],
                binaryListValues: [],
                dataType: 'String',
            },
            RETRY_ATTEMPTS: {
                stringValue: '129',
                stringListValues: [],
                binaryListValues: [],
                dataType: 'String',
            },
            ERROR_CODE: {
                stringValue: 'UNKNOWN',
                stringListValues: [],
                binaryListValues: [],
                dataType: 'String',
            },
        },
        md5OfBody: '2aa32c37659410cbbdfbde7cdb9b6370',
        eventSource: 'aws:sqs',
        eventSourceARN: 'arn:aws:sqs:ap-southeast-2:144028967590:EAI-EventBus-TargetDLQ-PRD',
        awsRegion: 'ap-southeast-2',
    },
];

const validRecord: SQSRecord[] = [
    {
        messageId: '1fd50124-5b23-42b5-82e6-c680a4851d7b',
        receiptHandle:
            'AQEB/oia0uOYJEf0VSfYMr7s8A/VJOP3ghqZUZ3C1fnxLvYgFOW9WNCQxN3XQHOdcXnsch8PeasxnZI74isTGb74WhyApkx39NVUFYa6jaZfmPhHbfTR/ixY9aSSw3KH+hmmg++trL0OH5FdY6W3a+08gaThVYbUM6EqpjJyRun/imzXX/DyhuL2fjyNSWpmbydM9wyxbmbMGMItWBbmnfsUDpnqe0OZE/hMd0wGR8YqrEkTIVeRCOMhAb8WgGRA0sJTePUYYntUk6QPAymirs02Ww+yuis9QLpALvtt3R4+am8z0edGP4y2LJjVybLKt8F3SE5JHRUwhLXcxbKyyikIGsCU1PNzNA5fBFscT9GrDJw+zPgiQbsjPXb3Earq1WpU7w9+n1ApGAMofU/pq2R7f2Mn7j72Kpypj2QWr3+yx5U=',
        body: '{"version":"0","id":"eb51f7d6-20c4-3d62-26d8-400784c44026","detail-type":"MaintenanceOrderChanged","source":"wel.operations.maintenance","account":"144028967590","time":"2023-04-03T09:05:04Z","region":"ap-southeast-2","resources":[],"detail":{"Data":{"_link":{"Internal":"https://events.api.woodside/v1/events?s3Key=wel.operations.maintenance/MaintenanceOrderChanged/9e828c4d-5af5-42b4-86c9-892647ecc5e5.json","External":"https://eap.api.woodside/eai-integrationhub-proxy/v1/api/events?s3Key=wel.operations.maintenance/MaintenanceOrderChanged/9e828c4d-5af5-42b4-86c9-892647ecc5e5.json"}},"Metadata":{"Guid":"9e828c4d-5af5-42b4-86c9-892647ecc5e5","Origin":"SAPECC","Version":"1","Time":"2023-04-03T17:01:24.454Z","MaintenancePlant":"AU05","TechnicalObjectType":"CRAF","BusinessKey":"002100360189","S3Bucket":"wel-eai-event-bucket-prd","S3Key":"wel.operations.maintenance/MaintenanceOrderChanged/9e828c4d-5af5-42b4-86c9-892647ecc5e5.json"}}}',
        attributes: {
            ApproximateReceiveCount: '1',
            AWSTraceHeader: 'Root=1-642a96c0-5e11633418264c0307188401;Parent=2dbea8005c8c6d82;Sampled=0',
            SentTimestamp: '1680599454177',
            SenderId: 'AIDAIDYJ7RPI7CT46XWPK',
            ApproximateFirstReceiveTimestamp: '1680599454178',
        },
        messageAttributes: {
            RULE_ARN: {
                stringValue:
                    'arn:aws:events:ap-southeast-2:144028967590:rule/EAI-EventBus-PRD/IDMS.maintenance.MaintenanceOrderChanged.p46ur',
                stringListValues: [],
                binaryListValues: [],
                dataType: 'String',
            },
            TARGET_ARN: {
                stringValue:
                    'arn:aws:events:ap-southeast-2:144028967590:api-destination/IDMS.BECSRESTAPI.ApiDestination-PRD/7e08279e-244f-4443-a5f4-b9c262da4d81',
                stringListValues: [],
                binaryListValues: [],
                dataType: 'String',
            },
            ERROR_MESSAGE: {
                stringValue:
                    'Unable to invoke ApiDestination endpoint: Timeout calling endpoint for API Destination: socket closed.',
                stringListValues: [],
                binaryListValues: [],
                dataType: 'String',
            },
            EXHAUSTED_RETRY_CONDITION: {
                stringValue: 'MaximumEventAgeInSeconds',
                stringListValues: [],
                binaryListValues: [],
                dataType: 'String',
            },
            RETRY_ATTEMPTS: {
                stringValue: '129',
                stringListValues: [],
                binaryListValues: [],
                dataType: 'String',
            },
            ERROR_CODE: {
                stringValue: 'UNKNOWN',
                stringListValues: [],
                binaryListValues: [],
                dataType: 'String',
            },
        },
        md5OfBody: '2aa32c37659410cbbdfbde7cdb9b6370',
        eventSource: 'aws:sqs',
        eventSourceARN: 'arn:aws:sqs:ap-southeast-2:144028967590:EAI-EventBus-TargetDLQ-PRD',
        awsRegion: 'ap-southeast-2',
    },
];

const validEventFailure = [
    {
        Attributes: {
            ApproximateFirstReceiveTimestamp: '1680599454178',
            ApproximateReceiveCount: '1',
            SenderId: 'AIDAIDYJ7RPI7CT46XWPK',
        },
        Body: '{"version":"0","id":"eb51f7d6-20c4-3d62-26d8-400784c44026","detail-type":"MaintenanceOrderChanged","source":"wel.operations.maintenance","account":"144028967590","time":"2023-04-03T09:05:04Z","region":"ap-southeast-2","resources":[],"detail":{"Data":{"_link":{"Internal":"https://events.api.woodside/v1/events?s3Key=wel.operations.maintenance/MaintenanceOrderChanged/9e828c4d-5af5-42b4-86c9-892647ecc5e5.json","External":"https://eap.api.woodside/eai-integrationhub-proxy/v1/api/events?s3Key=wel.operations.maintenance/MaintenanceOrderChanged/9e828c4d-5af5-42b4-86c9-892647ecc5e5.json"}},"Metadata":{"Guid":"9e828c4d-5af5-42b4-86c9-892647ecc5e5","Origin":"SAPECC","Version":"1","Time":"2023-04-03T17:01:24.454Z","MaintenancePlant":"AU05","TechnicalObjectType":"CRAF","BusinessKey":"002100360189","S3Bucket":"wel-eai-event-bucket-prd","S3Key":"wel.operations.maintenance/MaintenanceOrderChanged/9e828c4d-5af5-42b4-86c9-892647ecc5e5.json"}}}',
        ErrorCode: 'UNKNOWN',
        ErrorMessage:
            'Unable to invoke ApiDestination endpoint: Timeout calling endpoint for API Destination: socket closed.',
        EventId: 'eb51f7d6-20c4-3d62-26d8-400784c44026',
        EventName: 'wel.operations.maintenance@MaintenanceOrderChanged',
        EventTimestamp: '2023-04-03T09:05:04Z',
        HourTimestamp: 1680598800,
        MessageId: '1fd50124-5b23-42b5-82e6-c680a4851d7b',
        PK: 'ERR#IDMS.maintenance.MaintenanceOrderChanged.p46ur#IDMS.BECSRESTAPI.ApiDestination-PRD',
        RetryAttempts: '129',
        RuleArn:
            'arn:aws:events:ap-southeast-2:144028967590:rule/EAI-EventBus-PRD/IDMS.maintenance.MaintenanceOrderChanged.p46ur',
        SK: '#2023-04-04T09:10:54.177Z',
        SentTimestamp: '2023-04-04T09:10:54.177Z',
        SourceArn: 'arn:aws:sqs:ap-southeast-2:144028967590:EAI-EventBus-TargetDLQ-PRD',
        SubscriberApp: 'IDMS',
        SubscriptionId: 'IDMS.maintenance.MaintenanceOrderChanged.p46ur',
        TTL: 1685783454,
        TargetArn:
            'arn:aws:events:ap-southeast-2:144028967590:api-destination/IDMS.BECSRESTAPI.ApiDestination-PRD/7e08279e-244f-4443-a5f4-b9c262da4d81',
    },
];

const tooManyRecords: SQSRecord[] = [
    {} as SQSRecord,
    {} as SQSRecord,
    {} as SQSRecord,
    {} as SQSRecord,
    {} as SQSRecord,
    {} as SQSRecord,
    {} as SQSRecord,
    {} as SQSRecord,
    {} as SQSRecord,
    {} as SQSRecord,
    {} as SQSRecord,
    {} as SQSRecord,
    {} as SQSRecord,
    {} as SQSRecord,
    {} as SQSRecord,
    {} as SQSRecord,
    {} as SQSRecord,
    {} as SQSRecord,
    {} as SQSRecord,
    {} as SQSRecord,
    {} as SQSRecord,
    {} as SQSRecord,
    {} as SQSRecord,
    {} as SQSRecord,
    {} as SQSRecord,
    {} as SQSRecord,
    {} as SQSRecord,
    {} as SQSRecord,
    {} as SQSRecord,
    {} as SQSRecord,
];
