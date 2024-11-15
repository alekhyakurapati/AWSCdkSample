import jwt from 'jsonwebtoken';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { getClientCredentialsFromSecretsManager } from './get-client-credentials';

export interface RolesJwtPayload extends jwt.JwtPayload {
    roles?: string;
}

async function getRolesAzureToken(authHeader: string) {
    const tokenRegExp = new RegExp(/^(?<Bearer>Bearer) (?<token>[.\-_A-Za-z0-9]*)/);
    const azureRegExpResult = tokenRegExp.exec(authHeader);
    if (!azureRegExpResult || !azureRegExpResult.groups) {
        throw new Error('missing token');
    }
    const token = azureRegExpResult.groups.token;

    const clientCredentials = await getClientCredentialsFromSecretsManager(process.env.PORTAL_SECRET_NAME ?? '');

    const cca = new ConfidentialClientApplication({
        auth: {
            clientId: clientCredentials.clientId,
            authority: 'https://login.microsoftonline.com/a3299bba-ade6-4965-b011-bada8d1d9558',
            clientSecret: clientCredentials.clientSecret,
        },
    });

    const tokenResponse = await cca.acquireTokenOnBehalfOf({
        oboAssertion: token,
        scopes: [process.env.SCOPE_NAME ?? ''],
    });

    if (!tokenResponse?.accessToken) {
        throw new Error('Unable to generate token');
    }
    const decodedToken = <RolesJwtPayload>jwt.decode(tokenResponse.accessToken, { complete: true, json: true });
    console.log('Decoded token', decodedToken);

    if (!decodedToken?.payload) {
        throw new Error('missing token data');
    }
    return decodedToken.payload.roles;
}

export async function verifyRole(authHeader: string | undefined, role: string) {
    if (!authHeader) {
        throw new Error('Missing auth header');
    }
    const userRoles = await getRolesAzureToken(authHeader);
    console.log('UserRoles:', userRoles, `${role} in UserRoles?:`, userRoles.includes(role));
    return userRoles.includes(role);
}
