export interface PagedFailureMessage {
    Offset?: Record<string, string>;
    Data: FailureMessage[];
}
export interface FailureMessage {
    EventId: string;
    SubscriberApp: string;
    Attributes: Attributes;
    RetryAttempts: number;
    TTL: number;
    Body: string;
    MessageId: string;
    SourceArn: string;
    RuleArn: string;
    SubscriptionId: string;
    TargetArn: string;
    SentTimestamp: string;
    ErrorCode: string;
    ErrorMessage: string;
    EventTimestamp: string;
}
export interface Attributes {
    ApproximateFirstReceiveTimestamp: string;
    ApproximateReceiveCount: string;
    SenderId: string;
}

export interface EventFailureFilterValues {
    SubscriptionIds: string[];
    TargetArns: string[];
}

export interface EvaluatedKey {
    EventTimestamp: string;
    SK: string;
    PK: string;
    SubscriberApp: string;
}
