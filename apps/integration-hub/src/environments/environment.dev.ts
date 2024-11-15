export const environment = {
    production: false,
    baseApiUrl: 'https://5ng3ur146h.execute-api.ap-southeast-2.amazonaws.com', // integration-dev.dev.app.woodside
    elasticAPMUri: 'https://b977ed1afea94b5eb7d6117112880af0.apm.ap-southeast-2.aws.cloud.es.io:443',
    elasticMode: 'np',
    csp: {
        styleNonce: 'f4fcdc36-dd6f-41ef-bb01-ee979f26855c',
    },
    auth: {
        clientId: 'a2b66517-5102-4eca-9fd5-b65298e0af49', // integration-dev.dev.app.woodside
        redirectUri: 'https://integration-dev.dev.app.woodside/postlogin',
        authority: 'https://integration-dev.dev.app.woodside',
        knownAuthorities: ['https://integration-dev.dev.app.woodside'],
        request: {
            scopes: [
                'offline_access',
                'profile',
                'openid',
                'email',
                'api://a2b66517-5102-4eca-9fd5-b65298e0af49/.default',
            ],
        },
    },
};
