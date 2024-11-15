export const environment = {
    production: true,
    baseApiUrl: 'https://nvukqg3bd8.execute-api.ap-southeast-2.amazonaws.com',
    elasticAPMUri: 'https://45ee7d61328844c3a6b8f8756b5282a7.apm.ap-southeast-2.aws.cloud.es.io:443',
    elasticMode: 'prod',
    csp: {
        styleNonce: 'f4fcdc36-dd6f-41ef-bb01-ee979f26855c',
    },
    auth: {
        clientId: 'a380cbb2-e563-42cd-b5e2-287e523f6738',
        redirectUri: 'https://integration.app.woodside/postlogin',
        authority: 'https://integration.app.woodside',
        knownAuthorities: ['https://integration.app.woodside'],
        request: {
            scopes: [
                'offline_access',
                'profile',
                'openid',
                'email',
                'api://a380cbb2-e563-42cd-b5e2-287e523f6738/.default',
            ],
        },
    },
};
