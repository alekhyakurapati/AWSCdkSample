import { Subscription } from '@eai-event-integration-platform/interfaces';
import { PrimitiveAtom } from 'jotai';

export type FormVariant = 'create' | 'edit';

export interface SubscriptionsBySchemaName {
    SchemaName: string;
    OwnerRole: string;
    Description: string;
    Subscriptions: Subscription[];
    AppName: string;
    SchemaAppName?: string;
    SchemaDescription?: string;
}

export interface FilterOption {
    title: string;
    options: string[];
    atom: PrimitiveAtom<string | undefined>;
}
