// import { SortDirectionType } from 'react-virtualized';
import { BrokerTypes, SubscriptionState } from './enums';

export interface Tags {
    [key: string]: string;
}

export interface WoodsideEvent<T = any> {
    Data: T;
    Metadata: {
        Guid: string;
        Time: string;
        Version: string | number;
        [key: string]: number | string | boolean;
    };
}

// export interface SortingState {
//     sortKey: string | null;
//     sortDirection: SortDirectionType | null;
// }

export interface WebsocketConnection {
    connectionId: string;
}

export interface ApplicationAwsAccounts {
    NP?: ApplicationAwsAccountDetails;
    PRD?: ApplicationAwsAccountDetails;
}

export interface ApplicationAwsAccountDetails {
    Name?: string;
    Number?: string;
}
