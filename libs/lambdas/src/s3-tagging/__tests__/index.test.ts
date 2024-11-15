import { PutObjectTaggingCommand, S3 } from '@aws-sdk/client-s3';
import { STSClient } from '@aws-sdk/client-sts';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';
import { handler } from '../index';

describe('Testing S3 Tagging Lambda', () => {
    const stsMock = mockClient(STSClient);
    const ddbMock = mockClient(DynamoDBDocumentClient);
    const s3Mock = mockClient(S3);

    beforeEach(() => {
        stsMock.reset();
        ddbMock.reset();
        s3Mock.reset();
    });

    it('Applies tags to an object when it is created', async () => {
        stsMock.resolves({
            Credentials: { AccessKeyId: '', SecretAccessKey: '', SessionToken: '', Expiration: new Date() },
        });

        ddbMock.resolves({
            Items: [
                {
                    AppCINumber: 'AppCINumber',
                    AppName: 'AppName',
                    CostCode: 'CostCode',
                },
            ],
        });

        s3Mock.resolves({});

        await handler({
            Records: [
                {
                    eventVersion: '2.1',
                    eventSource: 'aws:s3',
                    awsRegion: 'ap-southeast-2',
                    eventTime: '2023-07-05T03:21:24.452Z',
                    eventName: 'ObjectCreated:Put',
                    userIdentity: {
                        principalId: 'AWS:AROA2SRRMEM3IL5J7L2NX:cs.A65120@woodside.com.au',
                    },
                    requestParameters: {
                        sourceIPAddress: '118.209.202.40',
                    },
                    responseElements: {
                        'x-amz-request-id': 'KXWZS80G70V7QVB4',
                        'x-amz-id-2':
                            'Xsa0WizuR4K0Ef0ks7dIqx1Y4wjqzpV6WQ/7qHYnDw0hOvbb+8FVGURoJKZGfLZPTXT9GEKtkSW9sq5o/SwAtThcZlw6284U',
                    },
                    s3: {
                        s3SchemaVersion: '1.0',
                        configurationId:
                            'arn:aws:cloudformation:ap-southeast-2:727026770742:stack/EAI-EventBrokerStack-JVDV/7025db50-da88-11ed-ad6f-0a670cf754c4-3145666066477175319',
                        bucket: {
                            name: 'wel-eai-event-bucket-jvdv',
                            ownerIdentity: {
                                principalId: 'A3SJNKTPV90RC5',
                            },
                            arn: 'arn:aws:s3:::wel-eai-event-bucket-jvdv',
                        },
                        object: {
                            key: 'wel.corporate-legal.corporate-affairs/Corporate/',
                            size: 0,
                            eTag: 'd41d8cd98f00b204e9800998ecf8427e',
                            sequencer: '0064A4E1B467156107',
                        },
                    },
                },
            ],
        });

        expect(s3Mock).toHaveReceivedCommandWith(PutObjectTaggingCommand, {
            Bucket: 'wel-eai-event-bucket-jvdv',
            Key: 'wel.corporate-legal.corporate-affairs/Corporate/',
            Tagging: {
                TagSet: [
                    { Key: 'cmdb:AppCode', Value: 'AppCINumber' },
                    { Key: 'cmdb:AppName', Value: 'AppName' },
                    { Key: 'CostCode', Value: 'CostCode' },
                ],
            },
        });
    });
});
