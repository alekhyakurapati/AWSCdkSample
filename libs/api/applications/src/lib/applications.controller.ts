import {
    Controller,
    Get,
    Logger,
    UseGuards,
    Param,
    DefaultValuePipe,
    ParseBoolPipe,
    Query,
    Post,
    Body,
    Put,
    BadRequestException,
    Delete,
    Req,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Request } from 'express';

import { AzureADGuard, Role, Roles, RolesGuard, AuthUser } from '@eai-event-integration-platform/api/auth';
import { StateChangedEvent } from '@eai-event-integration-platform/api/events';

import { ApplicationsService } from './applications.service';
import { UpdateApplicationDto, CreateApplicationDto } from './dto';

@Controller('applications')
@UseGuards(AzureADGuard, RolesGuard)
export class ApplicationsController {
    private readonly logger = new Logger(ApplicationsController.name);

    constructor(private appsService: ApplicationsService, private eventEmitter: EventEmitter2) {}

    /**
     * Get all applications in dynamodb store
     */
    @Get()
    @Roles(Role.Viewer)
    async listApplications(@Query('user-owned', new DefaultValuePipe(false), ParseBoolPipe) userOwned?: boolean) {
        this.logger.debug('[listApplications]');
        try {
            this.logger.log(`Getting list of applications`, 'this is some context');
            return await this.appsService.listApplications(userOwned);
        } catch (error: any) {
            this.logger.error(`Error listing application: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get one application in dynamodb store
     */
    @Get(':name')
    @Roles(Role.Viewer)
    async getApplication(@Param('name') name: string) {
        this.logger.debug('[getApplication]');
        try {
            this.logger.log(`Getting application detail for ${name}`);
            return await this.appsService.getApplication(name);
        } catch (error: any) {
            this.logger.error(`Error listing application for ${name}: ${error.message}`);
            throw error;
        }
    }

    /***
     * Create one application in dynamo store
     */
    @Post()
    @Roles(Role.Admin)
    async createApplication(@Body() createApplicationDto: CreateApplicationDto, @Req() request: Request) {
        this.logger.debug('[createApplication]');
        const actor = request.user as AuthUser;
        this.eventEmitter.emit(
            'state-change.requested',
            new StateChangedEvent('application.create', createApplicationDto, actor.username),
        );
        try {
            this.logger.log(`Creating new application with: ${JSON.stringify(createApplicationDto)}`);
            return await this.appsService.createApplication(createApplicationDto);
        } catch (error: any) {
            this.logger.error(`Error creating application: ${error.message}`);
            throw error;
        }
    }

    /***
     * Update one application in application table and sync application details in schema and subscription table
     */
    @Put(':appShortName')
    @Roles(Role.Admin)
    async updateApplication(
        @Param('appShortName') appShortName: string,
        @Body() updateApplicationDto: UpdateApplicationDto,
        @Req() request: Request,
    ) {
        this.logger.debug('[updateApplication]');
        const actor = request.user as AuthUser;
        this.eventEmitter.emit(
            'state-change.requested',
            new StateChangedEvent('application.update', updateApplicationDto, actor.username),
        );
        if (updateApplicationDto.ShortName !== appShortName) {
            throw new BadRequestException(`Mismatching Applictaion Short Name in body and URL query params`);
        }
        try {
            this.logger.log(`Updating application with: ${JSON.stringify(updateApplicationDto)}`);
            return await this.appsService.updateApplication(updateApplicationDto);
        } catch (error: any) {
            this.logger.error(`Error updating application for ${appShortName}: ${error.message}`);
            throw error;
        }
    }

    /***
     * Delete one application in dynamo store
     */
    @Delete(':appShortName')
    @Roles(Role.Admin)
    async deleteApplication(@Param('appShortName') appShortName: string, @Req() request: Request) {
        try {
            this.logger.debug('[deleteApplication]');
            const actor = request.user as AuthUser;
            this.eventEmitter.emit(
                'state-change.requested',
                new StateChangedEvent('application.delete', { AppName: appShortName }, actor.username),
            );
            return await this.appsService.deleteApplication(appShortName);
        } catch (error: any) {
            this.logger.error(`Error deleting application ${appShortName}: ${error.message}`);
            throw error;
        }
    }
}
