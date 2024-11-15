import {
    BadRequestException,
    Body,
    Controller,
    DefaultValuePipe,
    Delete,
    Get,
    Logger,
    Param,
    ParseBoolPipe,
    Post,
    Put,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { AuthUser, AzureADGuard, Role, Roles, RolesGuard } from '@eai-event-integration-platform/api/auth';
import { RestTargetsService } from '../service/rest-targets.service';
import { CreateConnectionDto, CreateDestinationDto, UpdateConnectionDto, UpdateDestinationDto } from '../dto';
import { Connection, Destination } from '@eai-event-integration-platform/interfaces';
import { Request } from 'express';

@Controller('connections')
@UseGuards(AzureADGuard, RolesGuard)
export class RestTargetsController {
    private readonly logger = new Logger(RestTargetsController.name);

    constructor(private restTargetsService: RestTargetsService) {}
    /**
     *  Creates Connections in eventbridge
     */
    @Post()
    @Roles(Role.User)
    async createConnection(@Body() createConnectionDto: CreateConnectionDto) {
        this.logger.debug('[createConnection]');
        const { ClientSecret, ...connectionData } = createConnectionDto;
        try {
            this.logger.log(`Creating new connection with: ${JSON.stringify(connectionData)}`);

            return await this.restTargetsService.createConnection(createConnectionDto);
        } catch (error: any) {
            this.logger.error(`Error creating connection: ${error.message}`);
            throw error;
        }
    }

    /**
     *  Updates Connections in eventbridge
     */
    @Put(':conName')
    @Roles(Role.User)
    async updateConnection(
        @Param('conName') conName: string,
        @Body() updateConnectionDto: UpdateConnectionDto,
        @Req() request: Request,
    ) {
        this.logger.debug('[updateConnection]');
        const actor = request.user as AuthUser;
        // make sure the url path param name matches the updateConnectionDto.ConnectionName
        if (updateConnectionDto.ConnectionName !== conName) {
            this.logger.error('Mismatching Connection Name in body and URL query params');
            throw new BadRequestException('Mismatching Connection Name in body and URL query params');
        }
        await this.restTargetsService.permissionCheck(conName, actor, undefined, false);
        try {
            this.logger.log(`Updating connection with: ${JSON.stringify(updateConnectionDto)}`);

            return await this.restTargetsService.updateConnection(updateConnectionDto);
        } catch (error: any) {
            this.logger.error(`Error updating connection: ${error.message}`);
            throw error;
        }
    }

    /**
     *  Updates Destination in eventbridge
     */
    @Put(':conName/destinations/:destName')
    @Roles(Role.User)
    async updateDestination(
        @Param('conName') conName: string,
        @Param('destName') destName: string,
        @Body() updateDestinationDto: UpdateDestinationDto,
        @Req() request: Request,
    ) {
        this.logger.debug('[updateDestination]');
        const actor = request.user as AuthUser;
        // make sure the url path param name matches the updateDestinationDto.DestinationName & updateDestinationDto.ConnectionName
        if (updateDestinationDto.DestinationName !== destName && updateDestinationDto.ConnectionName !== conName) {
            this.logger.error('Mismatching Connection/Destination Name in body and URL query params');
            throw new BadRequestException('Mismatching Connection/Destination Name in body and URL query params');
        }
        await this.restTargetsService.permissionCheck(conName, actor, destName, false);
        try {
            this.logger.log(`Updating destination with: ${JSON.stringify(updateDestinationDto)}`);

            return await this.restTargetsService.updateDestination(conName, updateDestinationDto);
        } catch (error: any) {
            this.logger.error(`Error updating destination: ${error.message}`);
            throw error;
        }
    }

    /**
     *  Creates Destinations in eventbridge
     */
    @Post(':conName/destinations')
    @Roles(Role.User)
    async createDestination(@Body() createDestinationDto: CreateDestinationDto) {
        this.logger.debug('[createDestination]');

        try {
            this.logger.log(`Creating new destination with: ${JSON.stringify(createDestinationDto)}`);

            return await this.restTargetsService.createDestination(createDestinationDto);
        } catch (error: any) {
            this.logger.error(`Error creating destination: ${error.message}`);
            throw error;
        }
    }

    /**
     *  Gets Specific Destination from Connection
     */
    @Get(':conName/destinations/:destName')
    async getDestination(@Param('conName') conName: string, @Param('destName') destName: string): Promise<Destination> {
        this.logger.debug('[getDestination]');
        try {
            this.logger.log(`Getting destination "${destName}"`);
            return (await this.restTargetsService.getDestinations(conName, destName))[0];
        } catch (error: any) {
            this.logger.error(`Error getting destination: ${error.message}`);
            throw error;
        }
    }

    /**
     *  Gets all Destinations from Connection
     */
    @Get(':conName/destinations')
    async getDestinations(@Param('conName') conName: string): Promise<Destination[]> {
        this.logger.debug('[getDestinations]');
        try {
            this.logger.log(`Getting destinations for connection "${conName}"`);
            return await this.restTargetsService.getDestinations(conName);
        } catch (error: any) {
            this.logger.error(`Error getting destinations: ${error.message}`);
            throw error;
        }
    }

    /**
     *  Gets Connection
     */
    @Get(':conName')
    async getConnection(@Param('conName') conName: string): Promise<Connection> {
        this.logger.debug('[getConnection]');
        try {
            this.logger.log(`Getting connection "${conName}"`);
            return await this.restTargetsService.getConnection(conName);
        } catch (error: any) {
            this.logger.error(`Error getting connection: ${error.message}`);
            throw error;
        }
    }

    /**
     * Gets a Connection's auth status
     *
     */
    @Get(':conName/auth-status')
    @Roles(Role.User)
    async getConnectionAuthStatus(@Param('conName') conName: string) {
        this.logger.debug('[getConnectionAuthStatus]');
        try {
            this.logger.log(`Getting connection "${conName}"'s auth status`);
            return await this.restTargetsService.getConnectionAuthStatus(conName);
        } catch (error: any) {
            this.logger.error(`Error getting connection's auth status: ${error.message}`);
            throw error;
        }
    }

    /**
     *  Gets all Connections or Destinations
     */
    @Get()
    async getAll(
        @Query('type', new DefaultValuePipe('Connection')) type: 'Connection' | 'Destination',
        @Query('user-owned', new DefaultValuePipe(false), ParseBoolPipe) userOwned?: boolean,
    ): Promise<Connection[]> {
        this.logger.debug('[getConnections]');
        try {
            this.logger.log(`Getting connections`);
            return await this.restTargetsService.getAllSwitch(type, userOwned);
        } catch (error: any) {
            this.logger.error(`Error getting connections: ${error.message}`);
            throw error;
        }
    }

    /**
     *  Delete a Specific Destination from a Connection
     */
    @Delete(':conName/destinations/:destName')
    @Roles(Role.User)
    async deleteDestination(
        @Param('conName') conName: string,
        @Param('destName') destName: string,
        @Req() request: Request,
    ) {
        this.logger.debug('[deleteDestination]');
        const actor = request.user as AuthUser;
        await this.restTargetsService.permissionCheck(conName, actor, destName);
        try {
            this.logger.log(`Deleting destination from connection: ${JSON.stringify(conName, null, 2)}`);

            return await this.restTargetsService.deleteDestination(conName, destName);
        } catch (error: any) {
            this.logger.error(`Error deleting destination from connection: ${error.message}`);
            throw error;
        }
    }

    /**
     *  Delete a Connection
     */
    @Delete(':conName')
    @Roles(Role.User)
    async deleteConnection(@Param('conName') conName: string, @Req() request: Request) {
        this.logger.debug('[deleteConnection]');
        const actor = request.user as AuthUser;
        await this.restTargetsService.permissionCheck(conName, actor, undefined, true);
        try {
            this.logger.log(`Deleting connection: ${JSON.stringify(conName, null, 2)}`);

            return await this.restTargetsService.deleteConnection(conName);
        } catch (error: any) {
            this.logger.error(`Error deleting connection: ${error.message}`);
            throw error;
        }
    }
}
