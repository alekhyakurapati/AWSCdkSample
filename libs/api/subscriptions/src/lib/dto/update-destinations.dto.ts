import { BrokerTypes, Destination, DestinationHttpMethods } from '@eai-event-integration-platform/interfaces';
import { IsEnum, IsNotEmpty, IsNumber, IsString, Matches, MaxLength } from 'class-validator';

export class UpdateDestinationDto implements Destination {
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

    @IsNotEmpty()
    @IsNumber()
    InvocationRateLimitPerSecond: number;

    @IsNotEmpty()
    @IsEnum(BrokerTypes, { message: 'Broker must be either PRD or NP' })
    Broker: BrokerTypes;

    @IsNotEmpty({ each: true, message: 'Array elements cannot be empty' })
    @IsString({ each: true, message: 'Array elements must be of type string' })
    ConnectionName: string;

    @IsNotEmpty()
    @IsString()
    OwnerRole: string;

    @IsNotEmpty()
    @IsString()
    AppName: string;
}
