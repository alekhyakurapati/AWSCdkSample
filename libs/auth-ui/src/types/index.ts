export type WebappEnvironment = {
    production: boolean;
    baseApiUrl: string;
    elasticAPMUri: string;
    elasticMode: string;
    auth: AuthEnvConfig;
};

export type AuthEnvConfig = {
    clientId: string;
    redirectUri: string;
    authority: string;
    knownAuthorities: string[];
    request: {
        scopes: string[];
    };
};
