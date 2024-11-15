import { IsNotEmpty, IsEnum } from 'class-validator';
import { BrokerTypes } from '@eai-event-integration-platform/interfaces';

export class PublisherDetails {
    @IsNotEmpty()
    AccountName: string;

    @IsNotEmpty()
    AccountNumber: string;
}

export class CreatePermissionDto {
    @IsNotEmpty()
    Prod: PublisherDetails;

    @IsNotEmpty()
    NonProd: PublisherDetails;
}
