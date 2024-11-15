import { Logger } from '@aws-lambda-powertools/logger';
import { LogLevel } from '@aws-lambda-powertools/logger/lib/types';
import { APIGatewayIAMAuthorizerResult, APIGatewayTokenAuthorizerEvent, Context } from 'aws-lambda';
import { verify, VerifyOptions } from 'azure-ad-verify-token';

const logLevel = (process.env.LOG_LEVEL as LogLevel) ?? 'ERROR';
const logger = new Logger({ serviceName: 'authorizerLogger', logLevel });

export const handler = async (
    request: APIGatewayTokenAuthorizerEvent,
    context: Context,
): Promise<APIGatewayIAMAuthorizerResult> => {
    logger.addContext(context);
    logger.info('Authorizer');
    let effect = 'deny';

    try {
        if (!request.authorizationToken) {
            throw new Error('Missing authorization token in headers');
        }

        const token = request.authorizationToken.replace('Bearer ', '');
        await verifyAccessToken(token);
        effect = 'allow';
        // console.log('Result of token verification', result);
    } catch (error: unknown) {
        console.error(error);
    }

    const iamPolicy: APIGatewayIAMAuthorizerResult = {
        principalId: 'user',
        policyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Action: 'execute-api:Invoke',
                    Effect: effect,
                    Resource: '*',
                },
            ],
        },
    };
    // console.log('generated iamPolicy:', iamPolicy);

    return iamPolicy;
};

export async function verifyAccessToken(accessToken: string) {
    const options: VerifyOptions = {
        jwksUri: 'https://login.microsoftonline.com/a3299bba-ade6-4965-b011-bada8d1d9558/discovery/v2.0/keys',
        issuer: 'https://login.microsoftonline.com/a3299bba-ade6-4965-b011-bada8d1d9558/v2.0',
        audience: process.env.AUDIENCE || '',
    };

    return await verify(accessToken, options);
}
