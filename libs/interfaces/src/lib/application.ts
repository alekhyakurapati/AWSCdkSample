import { ApplicationAwsAccounts } from './interfaces';
export interface Application {
    PK?: string;
    CINumber: string;
    ContactEmail: string;
    CostCode: string;
    LastUpdated?: string;
    Name: string;
    ShortName: string;
    Owner: string;
    OwnerRole: string;
    AssignmentGroup?: string;
    AwsAccounts?: ApplicationAwsAccounts;
    SupportEmail: string[];
}
