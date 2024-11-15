// Initializing environment variables beofre handler is imported.
process.env.EVENT_BUS_ARN = 'arn:aws:events:ap-southeast-2:727026770742:event-bus/EAI-EventBus-DEV';
process.env.EVENT_BUS_ARN_NP = 'arn:aws:events:ap-southeast-2:727026770742:event-bus/EAI-EventBus-DEV-NP';
process.env.BUCKET_NAME = 'wel-eai-event-bucket-dev';
process.env.BUCKET_NAME_NP = 'wel-eai-event-bucket-dev-np';
process.env.CUSTOMER_API_ID = 'prodid';
process.env.CUSTOMER_API_ID_NP = 'npid';
process.env.INTERNAL_API_URL = 'https://events-dev.dev.api.woodside/v1';
process.env.EXTERNAL_API_URL = 'https://eap-dev.api.woodside/eai-integrationhub-proxy/v1/api';
process.env.EXTERNAL_API_URL_NP = 'https://eap-test.api.woodside/eai-integrationhub-proxy/v1/api';

import handler from '../index';
import { s3Publisher } from '../s3-publisher';
import { s3Fetcher } from '../s3-fetcher';
import { eventBusPublisher } from '../eventbus-publisher';

jest.mock('../s3-publisher');
jest.mock('../s3-fetcher');
jest.mock('../eventbus-publisher');

describe('Testing request-handler', () => {
    let mockPostRequest: any;
    let mockGetRequest: any;
    let mockBody: { [k: string]: any };

    beforeEach(() => {
        jest.spyOn(console, 'log').mockImplementation();
        jest.spyOn(console, 'error').mockImplementation();
    });

    // placeholder for tests
    describe('Testing POST method', () => {
        beforeEach(() => {
            mockBody = {
                Metadata: {
                    Guid: 'UNIT-TEST-b2ae5042-1647-4fe8-9a31-cf46a4763a4c',
                    Time: 1637819678749,
                    Version: '1',
                },
                Data: {},
            };

            mockPostRequest = {
                httpMethod: 'POST',
                requestContext: {
                    apiId: 'npid',
                },
                headers: {},
                multiValueHeaders: {
                    Accept: ['*/*'],
                    'Accept-Encoding': ['gzip, deflate, br'],
                    Authorization: ['Bearer xxx'],
                    'Content-Type': ['application/json'],
                    Host: ['npid.execute-api.ap-southeast-2.amazonaws.com'],
                },
                isBase64Encoded: false,
                queryStringParameters: {
                    domain: 'wel.test',
                    event: 'testEventWithFlag',
                    'use-s3': 'true',
                },
                multiValueQueryStringParameters: {
                    domain: ['wel.test'],
                    event: ['testEventWithFlag'],
                    'use-s3': 'true',
                },
                pathParameters: {
                    proxy: 'events',
                },
                body: JSON.stringify(mockBody),
            };
        });
        it('Returns an error if request.queryStringParameters.domain is missing', async () => {
            mockPostRequest.queryStringParameters!['domain'] = undefined;
            const result = await handler(mockPostRequest);
            expect(result.statusCode).toEqual(500);
            expect(result.body).toEqual(JSON.stringify({ message: 'Error: Params ["domain"] - domain is required' }));
        });

        it('Returns an error if request.queryStringParameters.event is missing', async () => {
            mockPostRequest.queryStringParameters!['event'] = undefined;
            const result = await handler(mockPostRequest);
            expect(result.statusCode).toEqual(500);
            expect(result.body).toEqual(JSON.stringify({ message: 'Error: Params ["event"] - event is required' }));
        });

        it('Returns an error if request.queryStringParameters is empty', async () => {
            mockPostRequest.queryStringParameters = undefined;
            const result = await handler(mockPostRequest);
            expect(result.statusCode).toEqual(500);
            expect(result.body).toEqual(
                JSON.stringify({
                    message: 'Error: Params ["domain"] - domain is required | Params ["event"] - event is required',
                }),
            );
        });

        // placeholder for tests
        it('Returns an error if body.Metadata is missing', async () => {
            mockBody.Metadata = undefined;
            mockPostRequest.body = JSON.stringify(mockBody);
            const result = await handler(mockPostRequest);
            expect(result.statusCode).toEqual(500);
            expect(result.body).toEqual(
                JSON.stringify({
                    message:
                        'Error: There were missing fields: \n' +
                        'Missing "Metadata" from request body\n' +
                        'Missing "Guid" from Metadata field\n' +
                        'Missing "Time" from Metadata field\n' +
                        'Missing "Version" from Metadata field',
                }),
            );
        });

        it('Returns an error if body.Data is missing', async () => {
            mockBody.Data = undefined;
            mockPostRequest.body = JSON.stringify(mockBody);
            const result = await handler(mockPostRequest);
            expect(result.statusCode).toEqual(500);
            expect(result.body).toEqual(
                JSON.stringify({
                    message: 'Error: There were missing fields: \n' + 'Missing "Data" from request body',
                }),
            );
        });

        it('Will call the s3 publisher function', async () => {
            mockPostRequest.body =
                '{"Metadata":{"Guid":"UNIT-TEST-b2ae5042-1647-4fe8-9a31-cf46a4763a4c","Time":1637819678749,"Version":"1","StatusChange":"SCHD","SequenceNumber":"507","BusinessKey":"004100335021","ChangedDate":"20220930","ChangeTime":"000000"},"Data":{"BasicFinishDate":"20211029","BasicFinishTime":"235900","BasicStartDate":"20210813","BasicStartTime":"000000"}}';
            const result = await handler(mockPostRequest);
            expect(s3Publisher).toHaveBeenCalled();
        });

        // it('Will not call the s3 publisher function if flag is false', async () => {
        //     mockRequest.queryStringParameters['use-s3'] = 'false';
        //     console.log('Whatsthis', mockRequest);
        //     mockRequest.body =
        //         '{"Metadata":{"Guid":"UNIT-TEST-b2ae5042-1647-4fe8-9a31-cf46a4763a4c","Time":1637819678749,"Version":"1","StatusChange":"SCHD","SequenceNumber":"507","BusinessKey":"004100335021","ChangedDate":"20220930","ChangeTime":"000000"},"Data":{"BasicFinishDate":"20211029","BasicFinishTime":"235900","BasicStartDate":"20210813","BasicStartTime":"000000"}}';
        //     const result = await handler(mockRequest);
        //     console.log('result', result);
        //     expect(s3Publisher).not.toHaveBeenCalled();
        // });

        it('Will call the eventbus publisher function', async () => {
            mockPostRequest.body =
                '{"Metadata":{"Guid":"UNIT-TEST-b2ae5042-1647-4fe8-9a31-cf46a4763a4c","Time":1637819678749,"Version":"1","StatusChange":"SCHD","SequenceNumber":"507","BusinessKey":"004100335021","ChangedDate":"20220930","ChangeTime":"000000"},"Data":{"BasicFinishDate":"20211029","BasicFinishTime":"235900","BasicStartDate":"20210813","BasicStartTime":"000000"}}';
            await handler(mockPostRequest);
            expect(eventBusPublisher).toHaveBeenCalled();
        });
    });

    describe('Testing GET method', () => {
        beforeEach(() => {
            mockGetRequest = {
                httpMethod: 'GET',
                requestContext: {
                    apiId: 'npid',
                },
                headers: {},
                multiValueHeaders: {
                    Accept: ['*/*'],
                    'Accept-Encoding': ['gzip, deflate, br'],
                    Authorization: ['Bearer xxx'],
                    'Content-Type': ['application/json'],
                    Host: ['qgxga3ntre.execute-api.ap-southeast-2.amazonaws.com'],
                },
                isBase64Encoded: false,
                queryStringParameters: {
                    s3Key: 'wel.test/testEventWithFlag/UNIT-TEST-b2ae5042-1647-4fe8-9a31-cf46a4763a4c.json',
                },
                multiValueQueryStringParameters: {
                    s3Key: ['wel.test/testEventWithFlag/UNIT-TEST-b2ae5042-1647-4fe8-9a31-cf46a4763a4c.json'],
                },
                pathParameters: {
                    proxy: 'events',
                },
            };
        });
        it('Returns an error if request.queryStringParameters.s3Key is missing', async () => {
            mockGetRequest.queryStringParameters!['s3Key'] = undefined;
            const result = await handler(mockGetRequest);
            expect(result.statusCode).toEqual(500);
            expect(result.body).toEqual(JSON.stringify({ message: 'Error: Params ["s3Key"] - s3Key is required' }));
        });

        it('Returns an error if request has malicious query parameters', async () => {
            mockGetRequest.queryStringParameters['noGoodKey'] = 'No Good Value';
            const result = await handler(mockGetRequest);
            expect(result.statusCode).toEqual(500);
            expect(result.body).toEqual(
                JSON.stringify({ message: "Error: Params [] - Unrecognized key(s) in object: 'noGoodKey'" }),
            );
        });

        it('Will call s3 fetcher function', async () => {
            await handler(mockGetRequest);
            expect(s3Fetcher).toHaveBeenCalled();
        });
    });
});
