import { handler } from '../auth';
import * as azure from 'azure-ad-verify-token';
import { Context } from 'aws-lambda';

jest.mock('@aws-lambda-powertools/logger');
jest.mock('azure-ad-verify-token');

describe('tests authentication', function () {
    let mockRequest: any;
    let mockContext: Context;

    beforeEach(() => {
        mockRequest = {
            version: '1.0',
            identitySource: 'token',
            authorizationToken: 'token',
            resource: '',
            path: '/schemas/wel.example@sample-new',
            httpMethod: 'PUT',
            headers: {
                authorization: 'token',
                queryStringParameters: {},
                requestContext: {
                    accountId: '123456789',
                    apiId: 'abc',
                    domainName: 'abc.execute-api.ap-southeast-2.amazonaws.com',
                    domainPrefix: 'abc',
                    httpMethod: 'PUT',
                    path: '/schemas/wel.example@sample-new',
                    protocol: 'HTTP/1.1',
                    requestId: 'OwaNDg4BSwMEPLQ=',
                    requestTime: '10/Mar/2022:07:08:28 +0000',
                    requestTimeEpoch: 1646896108951,
                    resourceId: 'PUT /schemas/{name}',
                    resourcePath: '/schemas/{name}',
                    stage: '$default',
                },
                pathParameters: { name: 'wel.example@sample-new' },
                stageVariables: {},
            },
        };
    });

    it('Returns IAM policy with allow effect for valid tokens', async () => {
        const mockPolicy = {
            principalId: 'user',
            policyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'execute-api:Invoke',
                        Effect: 'allow',
                        Resource: '*',
                    },
                ],
            },
        };
        jest.spyOn(azure, 'verify').mockImplementation(() => Promise.resolve('success'));
        const response = await handler(mockRequest, mockContext);
        expect(response).toEqual(mockPolicy);
    });

    it('Returns IAM policy with deny effect for invalid tokens', async () => {
        const mockPolicy = {
            principalId: 'user',
            policyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'execute-api:Invoke',
                        Effect: 'deny',
                        Resource: '*',
                    },
                ],
            },
        };
        jest.spyOn(azure, 'verify').mockImplementation(() => Promise.reject());

        const response = await handler(mockRequest, mockContext);
        expect(response).toEqual(mockPolicy);
    });
});
