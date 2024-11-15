export enum SchemaVersionState {
    DRFT = 'drft',
    PUBL = 'publ',
    DEPR = 'depr',
}

export enum SubscriptionState {
    ENABLED = 'ENABLED',
    DISABLED = 'DISABLED',
}

export enum BrokerTypes {
    PRD = 'PRD',
    NP = 'NP',
}

export enum ConnectionHttpMethods {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
}

export enum DestinationHttpMethods {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    HEAD = 'HEAD',
    OPTIONS = 'OPTIONS',
    PATCH = 'PATCH',
    DELETE = 'DELETE',
}

export enum ConnectionAuthStatus {
    CREATING = 'CREATING',
    UPDATING = 'UPDATING',
    DELETING = 'DELETING',
    AUTHORIZED = 'AUTHORIZED',
    DEAUTHORIZED = 'DEAUTHORIZED',
    AUTHORIZING = 'AUTHORIZING',
    DEAUTHORIZING = 'DEAUTHORIZING',
}
