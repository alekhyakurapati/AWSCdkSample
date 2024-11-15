import { Subscription } from '@eai-event-integration-platform/interfaces';

export type AuthFormVariant = 'create' | 'edit' | 'editCredentials';
export type TabVariant = 'Auth' | 'Api';

export interface SubscriptionsBySchemaName {
    SchemaName: string;
    OwnerRole: string;
    Description: string;
    Subscriptions: Subscription[];
    AppName: string;
    SchemaAppName?: string;
    SchemaDescription?: string;
}

export enum HttpMethodColors {
    GET = '#03A9F4',
    DELETE = '#EA3959',
    HEAD = '#4054B2',
    OPTIONS = '#6D6D6F',
    PATCH = '#795548',
    POST = '#4CAF50',
    PUT = '#FF9800',
}
