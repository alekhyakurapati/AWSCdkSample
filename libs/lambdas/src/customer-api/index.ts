import { PutEventsRequestEntry } from '@aws-sdk/client-eventbridge';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { s3Publisher } from './s3-publisher';
import { s3Fetcher } from './s3-fetcher';
import { eventBusPublisher } from './eventbus-publisher';
import * as z from 'zod';
import { generateErrorMessage, ErrorMessageOptions } from 'zod-error';

if (
    !process.env.BUCKET_NAME ||
    !process.env.BUCKET_NAME_NP ||
    !process.env.EVENT_BUS_ARN ||
    !process.env.EVENT_BUS_ARN_NP ||
    !process.env.CUSTOMER_API_ID ||
    !process.env.CUSTOMER_API_ID_NP ||
    !process.env.INTERNAL_API_URL ||
    !process.env.EXTERNAL_API_URL ||
    !process.env.EXTERNAL_API_URL_NP
) {
    throw new Error('Environment variables failed to initialise');
}
const bucketNameNP = process.env.BUCKET_NAME_NP;
const bucketNamePRD = process.env.BUCKET_NAME;
const internalApiUrl = process.env.INTERNAL_API_URL;
const internalApiUrlNp = process.env.INTERNAL_API_URL_NP;
const externalApiUrl = process.env.EXTERNAL_API_URL;
const externalApiUrlNp = process.env.EXTERNAL_API_URL_NP;

export default async (request: APIGatewayProxyEvent) => {
    console.log('Request from API GW:', JSON.stringify(request));
    const response: APIGatewayProxyResult = {
        headers: { 'Content-Type': 'application/json' },
        statusCode: 500,
        body: '',
    };
    const httpMethod = request.httpMethod;

    try {
        const { bucketName, eventBusArn, responseInternalUrl, responseExternalUrl } = setEnv(
            process,
            request.requestContext.apiId,
        );
        if (httpMethod === 'GET') {
            const params = validateGetParams(request);
            const s3FetchResult = await s3Fetcher(params['s3Key'], bucketName);
            response.statusCode = 200;
            response.body = s3FetchResult as string;
        } else if (httpMethod === 'POST') {
            const params = validatePostParams(request);
            const requestBody = validateRequest(request);
            const putEventRequest: PutEventsRequestEntry = {
                Detail: requestBody,
                Source: params['domain'],
                DetailType: params['event'],
            };
            // Transform data if flag for s3 is true
            const eventBusRequest =
                params['use-s3'] === 'true'
                    ? await s3Publisher(putEventRequest, bucketName, responseInternalUrl, responseExternalUrl)
                    : putEventRequest;

            // Publish data to eventbus
            const eventBusResult = await eventBusPublisher({ ...eventBusRequest, EventBusName: eventBusArn });
            response.statusCode = 200;
            response.body = JSON.stringify(eventBusResult);
        } else {
            response.statusCode = 405;
            response.body = 'Method Not Allowed';
        }
    } catch (error: any) {
        if (error.Code === 'NoSuchKey') {
            response.statusCode = error.$metadata.httpStatusCode;
            response.body = JSON.stringify({
                ErrorCode: error.$metadata.httpStatusCode,
                ErrorMessage: error.message,
            });
        } else {
            console.error(`Error handling request: ${error}`);
            response.body = JSON.stringify({ message: `${error}` });
        }
    }
    return response;
};

export const validatePostParams = (request: APIGatewayProxyEvent) => {
    const postMethodParams = z
        .object({
            domain: z
                .string({
                    required_error: 'domain is required',
                })
                .nonempty({ message: 'domain must contain at least 1 character(s)' }),
            event: z
                .string({
                    required_error: 'event is required',
                })
                .nonempty({ message: 'event must contain at least 1 character(s)' }),
            'use-s3': z.enum(['true', 'false']).optional().default('false'),
        })
        .strict();
    const options: ErrorMessageOptions = {
        delimiter: {
            component: ' - ',
        },
        path: {
            enabled: true,
            type: 'zodPathArray',
            label: 'Params ',
        },
        code: {
            enabled: false,
        },
        message: {
            enabled: true,
            label: '',
        },
    };
    const validationResult = postMethodParams.safeParse(request.queryStringParameters || {});
    if (validationResult.success == false) {
        const errorMessage = generateErrorMessage(validationResult.error.issues, options);
        throw new Error(errorMessage);
    } else {
        return validationResult.data;
    }
};

export const validateGetParams = (request: APIGatewayProxyEvent) => {
    const getMethodParams = z
        .object({
            s3Key: z
                .string({
                    required_error: 's3Key is required',
                })
                .nonempty({ message: 's3Key must contain at least 1 character(s)' }),
        })
        .required()
        .strict();
    const validationResult = getMethodParams.safeParse(request.queryStringParameters || {});

    const options: ErrorMessageOptions = {
        delimiter: {
            component: ' - ',
        },
        path: {
            enabled: true,
            type: 'zodPathArray',
            label: 'Params ',
        },
        code: {
            enabled: false,
        },
        message: {
            enabled: true,
            label: '',
        },
    };
    if (validationResult.success == false) {
        const errorMessage = generateErrorMessage(validationResult.error.issues, options);
        throw new Error(errorMessage);
    } else {
        return validationResult.data;
    }
};

export const setEnv = (process: NodeJS.Process, apiId: string) => {
    if (apiId !== process.env.CUSTOMER_API_ID_NP && apiId !== process.env.CUSTOMER_API_ID) {
        throw new Error('The incoming api id does not match environment variables.');
    }
    return apiId === process.env.CUSTOMER_API_ID_NP
        ? {
              bucketName: bucketNameNP,
              eventBusArn: process.env.EVENT_BUS_ARN_NP,
              responseInternalUrl: internalApiUrlNp || `https://${apiId}.execute-api.ap-southeast-2.amazonaws.com/v1`,
              responseExternalUrl: externalApiUrlNp,
          }
        : {
              bucketName: bucketNamePRD,
              eventBusArn: process.env.EVENT_BUS_ARN,
              responseInternalUrl: internalApiUrl,
              responseExternalUrl: externalApiUrl,
          };
};

export const validateRequest = (request: APIGatewayProxyEvent) => {
    // Check event body
    if (!request.body) {
        throw new Error('Missing body');
    }

    const body = JSON.parse(request.body);

    const messages = [];

    if (!body.Data) {
        messages.push('Missing "Data" from request body');
    }

    if (!body.Metadata) {
        messages.push('Missing "Metadata" from request body');
    }

    if (!body.Metadata?.Guid) {
        messages.push('Missing "Guid" from Metadata field');
    }

    if (!body.Metadata?.Time) {
        messages.push('Missing "Time" from Metadata field');
    }

    if (!body.Metadata?.Version) {
        messages.push('Missing "Version" from Metadata field');
    }

    if (messages.length) {
        throw new Error('There were missing fields: \n' + messages.join('\n'));
    }

    return request.body;
};
