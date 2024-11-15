import { PutObjectCommand, S3 } from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import { s3Publisher } from '../s3-publisher';

const s3Mock = mockClient(S3);

describe('Test for S3 data publisher lambda', function () {
    let requestBody: any;

    beforeEach(() => {
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
                    DeviationDate: '00000000',
                    EqMaterialNumber: '',
                    EqMatlSerialNumber: '',
                    EquipmentDesc: '',
                    EquipmentNumber: '',
                    EquityType: 'T01',
                    EventCode: 'AU18CM9999999Z',
                    EventCodeDesc: 'AU18 Campaign Default',
                    EventEndDate: '29991231',
                },
            },
            DetailType: 'WorkOrderStatusChange',
            Source: 'wel.operations.maintenance',
        };
    });

    it('Produces error message with empty requestBody for s3', async () => {
        requestBody = {};
        await expect(
            s3Publisher(
                requestBody,
                '',
                'https://events-dev.dev.api.woodside/v1',
                'https://eap-dev.api.woodside/eai-integrationhub-proxy/v1/api',
            ),
        ).rejects.toThrowError();
    });

    it('Can publish data to S3', async () => {
        const mockResponse = {
            $metadata: {
                httpStatusCode: 200,
                extendedRequestId: 'my5+oY574Y02pp7yUjNZuwMEVjpAPMjNH55pXwraj4N6m12sjhG2sIXWkyzKgIjDZ6OozDkEtxQ=',
                attempts: 1,
                totalRetryDelay: 0,
            },
            ETag: '"13d0d3ef144009054a0ccf4fae0f0747"',
            ServerSideEncryption: 'AES256',
        };
        const mockResult = {
            Detail: '{"Data":{"_link":{"Internal":"https://events-dev.dev.api.woodside/v1/events?s3Key=wel.operations.maintenance/WorkOrderStatusChange/UNIT-TEST-b2ae5042-1647-4fe8-9a31-cf46a4763a4c.json","External":"https://eap-dev.api.woodside/eai-integrationhub-proxy/v1/api/events?s3Key=wel.operations.maintenance/WorkOrderStatusChange/UNIT-TEST-b2ae5042-1647-4fe8-9a31-cf46a4763a4c.json"}},"Metadata":{"Guid":"UNIT-TEST-b2ae5042-1647-4fe8-9a31-cf46a4763a4c","Time":1637819678749,"Version":"1","StatusChange":"SCHD","SequenceNumber":"507","BusinessKey":"004100335021","ChangedDate":"20220930","ChangeTime":"000000","S3Bucket":"wel-eai-event-bucket-dev","S3Key":"wel.operations.maintenance/WorkOrderStatusChange/UNIT-TEST-b2ae5042-1647-4fe8-9a31-cf46a4763a4c.json"}}',
            DetailType: 'WorkOrderStatusChange',
            Source: 'wel.operations.maintenance',
        };
        requestBody.Detail = JSON.stringify(requestBody.Detail);
        s3Mock.on(PutObjectCommand).resolves(mockResponse);
        const result = await s3Publisher(
            requestBody,
            'wel-eai-event-bucket-dev',
            'https://events-dev.dev.api.woodside/v1',
            'https://eap-dev.api.woodside/eai-integrationhub-proxy/v1/api',
        );
        expect(result).toEqual(mockResult);
    });
});
