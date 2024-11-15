import { BrokerTypes, Destination, DestinationHttpMethods } from '@eai-event-integration-platform/interfaces';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator';

export class CreateDestinationDto implements Destination {
    @IsNotEmpty()
    @IsString()
    DestinationName: string;

    @IsNotEmpty()
    @IsString()
    Description: string;

    @IsNotEmpty()
    @IsString()
    @MaxLength(2048)
    @Matches(/^((%[0-9A-Fa-f]{2}|[-()_.!~*';/?:@\x26=+$,A-Za-z0-9])+)([).!';/?:,])?$/, {
        message: 'InvocationEndpoint is in an invalid format',
    })
    InvocationEndpoint: string;

    @IsNotEmpty()
    @IsString()
    @IsEnum(DestinationHttpMethods, { message: 'Valid values are POST | GET | HEAD | OPTIONS | PUT | PATCH | DELETE' })
    HttpMethod: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    InvocationRateLimitPerSecond = 300;

    @IsNotEmpty()
    @IsEnum(BrokerTypes, { message: 'Broker must be either PRD or NP' })
    Broker: BrokerTypes;

    @IsNotEmpty()
    @IsString()
    ConnectionName: string;

    @IsNotEmpty()
    @IsString()
    OwnerRole: string;

    @IsNotEmpty()
    @IsString()
    AppName: string;
}
