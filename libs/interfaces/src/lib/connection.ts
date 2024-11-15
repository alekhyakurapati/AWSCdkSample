import { BrokerTypes } from './enums';

export interface Connection {
    ConnectionName?: string;
    Description?: string;
    AuthorizationEndpoint?: string;
    HttpMethod?: string;
    ClientID?: string;
    ClientSecret?: string;
    Broker?: BrokerTypes;
    ConnectionArn?: string;
    ConnectionState?: string;
    LastUpdated?: Date | string;
    OwnerRole?: string;
    AppName?: string;
    Scope?: string;
}
