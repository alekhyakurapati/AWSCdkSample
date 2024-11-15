import { Application } from '@eai-event-integration-platform/interfaces';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateApplicationDto implements Application {
    @IsNotEmpty()
    @IsString()
    CINumber: string;

    @IsNotEmpty()
    @IsString()
    ContactEmail: string;

    @IsNotEmpty()
    @IsString({ each: true })
    SupportEmail: string[];

    @IsNotEmpty()
    @IsString()
    CostCode: string;

    @IsNotEmpty()
    @IsString()
    Name: string;

    @IsNotEmpty()
    @IsString()
    Owner: string;

    @IsNotEmpty()
    @IsString()
    OwnerRole: string; // TODO: should be auto generated with "Event.User.<ShortName>"

    @IsNotEmpty()
    @IsString()
    ShortName: string;

    @IsNotEmpty()
    @IsString()
    AssignmentGroup: string;

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
