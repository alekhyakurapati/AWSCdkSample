import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';

export interface ClientCredentials {
    clientId: string;
    clientSecret: string;
}

export async function getClientCredentialsFromSecretsManager(
    clientCredentialsSecretName: string,
): Promise<ClientCredentials> {
    const client = new SecretsManagerClient({});

    const response = await client.send(new GetSecretValueCommand({ SecretId: clientCredentialsSecretName }));

    if (!response.SecretString) {
        throw new Error('Failed to retrieve client secret');
    }

    return JSON.parse(response.SecretString);
}
