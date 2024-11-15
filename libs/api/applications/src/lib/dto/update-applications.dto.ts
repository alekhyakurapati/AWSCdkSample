import { Application } from '@eai-event-integration-platform/interfaces';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class UpdateApplicationDto implements Application {
    @IsOptional()
    @IsString()
    CINumber: string;

    @IsOptional()
    @IsString()
    ContactEmail: string;

    @IsOptional()
    @IsString({ each: true })
    SupportEmail: string[];

    @IsOptional()
    @IsString()
    CostCode: string;

    @IsOptional()
    @IsString()
    Name: string;

    @IsOptional()
    @IsString()
    Owner: string;

    @IsOptional()
    @IsString()
    OwnerRole: string; // TODO: can't update an OwnerRole

    @IsNotEmpty()
    @IsString()
    ShortName: string;

    @IsOptional()
    @IsString()
    AssignmentGroup = '-';

    @IsOptional()
    @IsString()
    AwsAccountNameNP: string;

    @IsOptional()
    @IsString()
    AwsAccountNumberNP: string;

    @IsOptional()
    @IsString()
    AwsAccountNamePRD: string;

    @IsOptional()
    @IsString()
    AwsAccountNumberPRD: string;
}
