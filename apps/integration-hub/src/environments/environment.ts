// This file can be replaced during build by using the `fileReplacements` array.
// When building for production, this file is replaced with `environment.prod.ts`.

export const environment = {
    production: false,
    // baseApiUrl: 'https://f48h277olb.execute-api.ap-southeast-2.amazonaws.com', // integration-rp.dev.app.woodside
    // baseApiUrl: 'https://5ng3ur146h.execute-api.ap-southeast-2.amazonaws.com', // integration-dev.dev.app.woodside
    baseApiUrl: 'http://localhost:3333',
    elasticAPMUri: 'https://b977ed1afea94b5eb7d6117112880af0.apm.ap-southeast-2.aws.cloud.es.io:443',
    elasticMode: 'local',
    csp: {
        styleNonce: 'f4fcdc36-dd6f-41ef-bb01-ee979f26855c', // value needs to match the one provided in ./ci/app.config.json
    },
    auth: {
        clientId: 'a2b66517-5102-4eca-9fd5-b65298e0af49', // integration-dev.dev.app.woodside
        redirectUri: 'http://localhost:4200/postlogin',
        authority: 'https://login.microsoftonline.com/a3299bba-ade6-4965-b011-bada8d1d9558/v2.0',
        knownAuthorities: ['https://login.microsoftonline.com/a3299bba-ade6-4965-b011-bada8d1d9558'],
        request: {
            scopes: [
                'offline_access',
                'profile',
                'openid',
                'email',
                'api://a2b66517-5102-4eca-9fd5-b65298e0af49/.default',
            ],
        },

        // integration-rjp.dev.app.woodside
        // clientId: 'ff188c42-c189-4237-b046-8072112c78d2',
        // redirectUri: 'https://integration-rjp.dev.app.woodside/postlogin',
        // authority: 'https://integration-rjp.dev.app.woodside',
        // knownAuthorities: ['https://integration-rjp.dev.app.woodside'],
    },
};
