export const environment = {
    production: true,
    baseApiUrl: 'https://pybs0vopg7.execute-api.ap-southeast-2.amazonaws.com',
    elasticAPMUri: 'https://b977ed1afea94b5eb7d6117112880af0.apm.ap-southeast-2.aws.cloud.es.io:443',
    elasticMode: 'np',
    csp: {
        styleNonce: 'f4fcdc36-dd6f-41ef-bb01-ee979f26855c',
    },
    auth: {
        clientId: '06b32259-0042-4583-b6ca-78d8bd3ceaba',
        redirectUri: 'https://integration-qa.dev.app.woodside/postlogin',
        authority: 'https://integration-qa.dev.app.woodside',
        knownAuthorities: ['https://integration-qa.dev.app.woodside'],
        request: {
            scopes: [
                'offline_access',
                'profile',
                'openid',
                'email',
                'api://06b32259-0042-4583-b6ca-78d8bd3ceaba/.default',
            ],
        },
    },
};
