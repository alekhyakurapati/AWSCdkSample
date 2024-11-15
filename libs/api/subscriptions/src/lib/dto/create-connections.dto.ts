import { BrokerTypes, Connection, ConnectionHttpMethods } from '@eai-event-integration-platform/interfaces';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CreateConnectionDto implements Connection {
    @IsNotEmpty()
    @IsString()
    ConnectionName: string;

    @IsNotEmpty()
    @IsString()
    Description: string;

    @IsNotEmpty()
    @IsString()
    AuthorizationEndpoint: string;

    @IsNotEmpty()
    @IsString()
    @IsEnum(ConnectionHttpMethods, { message: 'Valid values are GET | POST | PUT' })
    HttpMethod: string;

    @IsNotEmpty()
    @IsString()
    ClientID: string;

    @IsNotEmpty()
    @IsString()
    ClientSecret: string;

    @IsNotEmpty()
    @IsEnum(BrokerTypes, { message: 'Broker must be either PRD or NP' })
    Broker: BrokerTypes;

    @IsNotEmpty()
    @IsString()
    OwnerRole: string;

    @IsNotEmpty()
    @IsString()
    AppName: string;

    @IsNotEmpty()
    @IsString()
    Scope: string;
}
