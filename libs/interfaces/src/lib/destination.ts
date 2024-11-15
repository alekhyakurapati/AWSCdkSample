import { BrokerTypes } from './enums';

export interface Destination {
    DestinationName?: string;
    Description?: string;
    InvocationEndpoint?: string;
    HttpMethod?: string;
    InvocationRateLimitPerSecond?: number;
    Broker?: BrokerTypes;
    DestinationArn?: string;
    DestinationState?: string;
    LastUpdated?: Date | string;
    ConnectionName?: string;
    OwnerRole?: string;
    AppName?: string;
}
