import { BrokerTypes, SubscriptionState } from './enums';

export interface Subscription {
    Name?: string;
    Targets?: string[];
    Description?: string;
    SchemaName?: string;
    SchemaVersion?: string;
    RulePattern?: string;
    RuleArn?: string;
    EventBusName?: string;
    Broker?: BrokerTypes;
    OwnerRole?: string;
    SubscriptionOwner?: string;
    SubscribingDomain?: string;
    AppName?: string;
    AppCINumber?: string;
    CostCode?: string;
    State?: SubscriptionState;
    CreatedBy?: string;
    LastUpdated?: string | Date;
    LastUpdatedBy?: string;
}
