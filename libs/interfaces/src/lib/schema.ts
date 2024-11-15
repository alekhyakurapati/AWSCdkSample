import { SchemaVersionState } from './enums';
import { Subscription } from './subscription';

export interface SchemaSummary {
    SchemaName?: string;
    SchemaArn?: string;
    Description?: string;
    SchemaType?: string;

    EventClassification?: 'internal' | 'confidential' | 'most confidential';
    AppName?: string;
    AppCINumber?: string;
    Domain?: string;
    CostCode?: string;
    SchemaOwner?: string;
    SchemaSupportGroup?: string;
    OwnerRole?: string;

    VersionCount?: number;
    AvailableVersions?: AvailableVersions;

    CreatedBy?: string;
    LastUpdated?: string;
    LastUpdatedBy?: string;
}

export interface SchemaDetails {
    SchemaName?: string;
    SchemaArn?: string;
    Description?: string;
    SchemaType?: string;

    EventClassification?: 'internal' | 'confidential' | 'most confidential';
    AppName?: string;
    AppCINumber?: string;
    Domain?: string;
    CostCode?: string;
    SchemaOwner?: string;
    SchemaSupportGroup?: string;
    OwnerRole?: string;

    Content?: string;
    Version?: string; // PlatformVersion
    State?: string;
    AWSVersion?: string;
    VersionCreatedDate?: string;

    VersionCount?: number;
    AvailableVersions?: AvailableVersions;
    Subscriptions?: Subscription[];

    CreatedBy?: string;
    LastUpdated?: string;
    LastUpdatedBy?: string;
}

export interface Version {
    Content?: string;
    Version?: string;
    State?: SchemaVersionState;
    AWSVersion?: string;
    VersionCreatedDate?: string;
    CreatedBy?: string;
    LastUpdatedBy?: string;
    LastUpdated?: string;
}

export interface AvailableVersions {
    [version: string]: SchemaVersionState;
}
