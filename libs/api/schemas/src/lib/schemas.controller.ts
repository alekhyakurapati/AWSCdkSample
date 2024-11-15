import { AuthUser, AzureADGuard, Role, Roles, RolesGuard } from '@eai-event-integration-platform/api/auth';
import { StateChangedEvent } from '@eai-event-integration-platform/api/events';
import { SchemaDetails, SchemaSummary, Version } from '@eai-event-integration-platform/interfaces';
import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    ForbiddenException,
    Get,
    HttpCode,
    Logger,
    Param,
    Post,
    Put,
    Req,
    UseGuards,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Request } from 'express';
import { CreateSchemaDto, UpdateSchemaDto } from './dto';
import { SchemasService } from './schemas.service';
import { recentEventsParamsSchema } from './validators/recent-events-params';
// import { PublishSchemaDto } from './dto/publish-schema.dto';

@Controller('schemas')
@UseGuards(AzureADGuard, RolesGuard)
export class SchemasController {
    private readonly logger = new Logger(SchemasController.name);

    constructor(private readonly schemasService: SchemasService, private eventEmitter: EventEmitter2) {}

    @Get()
    @Roles(Role.Viewer)
    async listSchemas(): Promise<SchemaSummary[]> {
        this.logger.debug('[listSchemas]');
        try {
            return await this.schemasService.listSchemas();
        } catch (error: any) {
            this.logger.error(`Error finding all schemas: ${error.message}`);
            throw error;
        }
    }

    @Get(':name')
    @Roles(Role.Viewer)
    async getSchema(@Param('name') name: string): Promise<SchemaDetails> {
        this.logger.debug('[getSchema]');
        try {
            this.logger.debug(`Finding schema by name (${name})`);
            return await this.schemasService.getSchemaWithSubscriptions(name);
        } catch (error: any) {
            this.logger.error(`Error find schemas (${name}): ${error.message}`);
            throw error;
        }
    }

    @Post()
    @Roles(Role.User)
    async create(@Body() createSchemaDto: CreateSchemaDto, @Req() request: Request): Promise<SchemaDetails> {
        this.logger.debug('[create]');
        const actor = request.user as AuthUser;
        this.eventEmitter.emit(
            'state-change.requested',
            new StateChangedEvent('schema.create', createSchemaDto, actor.username),
        );

        try {
            this.logger.debug(`Creating new schema with: ${JSON.stringify(createSchemaDto, null, 2)}`);
            return await this.schemasService.create(createSchemaDto);
        } catch (error: any) {
            this.logger.error(`Error creating schema: ${error.message}`);
            throw error;
        }
    }

    @Put(':name')
    @Roles(Role.User)
    async update(@Param('name') name: string, @Body() updateSchemaDto: UpdateSchemaDto, @Req() request: Request) {
        this.logger.debug('[update]');
        const actor = request.user as AuthUser;
        this.eventEmitter.emit(
            'state-change.requested',
            new StateChangedEvent('schema.update', updateSchemaDto, actor.username),
        );

        // make sure the url path param name matches the requestSchema.SchemaName
        if (updateSchemaDto.SchemaName !== name) {
            this.logger.error('Mismatching SchemaName in body and URL query params');
            throw new BadRequestException('Mismatching SchemaName in body and URL query params');
        }

        await this.permissionCheck(name, actor);

        try {
            this.logger.debug(`Updating existing schema with (${JSON.stringify(updateSchemaDto, null, 2)})`);
            return await this.schemasService.update(updateSchemaDto);
        } catch (error: any) {
            this.logger.error(`Error updating schema: ${error.message}`);
            throw error;
        }
    }

    @Delete(':name')
    @HttpCode(204)
    @Roles(Role.Admin)
    async remove(@Param('name') name: string, @Req() request: Request) {
        this.logger.debug('[remove]');
        const actor = request.user as AuthUser;
        await this.permissionCheck(name, actor);
        this.eventEmitter.emit(
            'state-change.requested',
            new StateChangedEvent('schema.delete', { SchemaName: name }, actor.username),
        );
        // TODO: improve the eventstore table by removing all events associated with ones that get deleted. Will save
        // unecessary infrastructure changes during a restore
        try {
            this.logger.debug(`Deleting schema (${name})`);
            await this.schemasService.delete(name);
            return;
        } catch (error: any) {
            this.logger.error(`Error deleting schema: ${error.message}`);
            throw error;
        }
    }

    @Get(':name/versions')
    @Roles(Role.Viewer)
    async listSchemaVersions(@Param('name') name: string): Promise<Version[]> {
        this.logger.debug('[listSchemaVersions]');
        try {
            this.logger.debug(`Finding all schema versions for (${name})`);
            return await this.schemasService.listSchemaVersions(name);
        } catch (error: any) {
            this.logger.error(`Error finding all schemas: ${error.message}`);
            throw error;
        }
    }

    @Get(':name/versions/:version')
    @Roles(Role.Viewer)
    async findSchemaVersion(@Param('name') name: string, @Param('version') version: string) {
        this.logger.debug('[findSchemaVersion]');
        try {
            this.logger.debug(`Finding schema version (${version}) for (${name})`);
            return await this.schemasService.getSchemaWithSubscriptions(name, version);
        } catch (error: any) {
            this.logger.error(`Error finding all schemas: ${error.message}`);
            throw error;
        }
    }

    @Get(':name/versions/:version/codebinding')
    @Roles(Role.Viewer)
    async downloadSchemaVersionCodeBinding(@Param('name') name: string, @Param('version') version: string) {
        this.logger.debug('[downloadSchemaVersionCodeBinding]');
        try {
            this.logger.debug(`Downloading schema version (${version}) for (${name})`);
            const data = await this.schemasService.downloadCodeBinding(name, version);
            const res = {
                output: data,
            };
            return res;
        } catch (error: any) {
            this.logger.error(`Error downloading code binding: ${error.message}`);
            throw error;
        }
    }

    @Post(':name/versions/publish')
    @Roles(Role.User)
    async publishedSchemaVersion(
        @Param('name') schemaName: string,
        // @Param('version', ParseIntPipe) version: string,
        @Req() request: Request,
    ) {
        this.logger.debug('[publishSchemaVersion]');
        const actor = request.user as AuthUser;
        // check for permissions
        await this.permissionCheck(schemaName, actor);
        this.eventEmitter.emit(
            'state-change.requested',
            new StateChangedEvent('schema.publish', { SchemaName: schemaName }, actor.username),
        );

        try {
            this.logger.debug(`Publishing schema version for (${schemaName})`);

            await this.schemasService.publishSchema(schemaName);

            // return schema with version list and content
            return await this.schemasService.getSchemaWithSubscriptions(schemaName);
        } catch (error: any) {
            this.logger.error(`Error updating schema: ${error.message}`);
            throw error;
        }
    }

    @Get(':name/recent-events')
    async getRecentEvents(@Req() request: Request) {
        this.logger.debug(`[getRecentEvents]`);
        try {
            const {
                hours,
                name: { eventSource, eventName },
            } = recentEventsParamsSchema.parse({ ...request.params, ...request.query });
            this.logger.debug(`Getting recent events from last ${hours} hours for ${eventSource}@${eventName}`);

            return this.schemasService.getRecentEvents(eventSource, eventName, hours);
        } catch (err: unknown) {
            console.log(err instanceof Error ? err.message : 'Encountered unknown error');
            throw err;
        }
    }

    private async permissionCheck(schemaName: string, currentUser: AuthUser) {
        // check if user is allowed to update schema
        // get the existing schema as we don't want the user to be able to provide a different
        // OwnerRole value in the request to bypass the security check
        const existingSchema = await this.schemasService.getSchema(schemaName);

        // TODO: see if there is a better way to do this with existing route guards
        if (!currentUser.roles.includes(existingSchema.OwnerRole + '')) {
            this.logger.warn(`User with role ${currentUser.roles} not allowed to update schema ${schemaName}`);
            throw new ForbiddenException(
                'Forbidden, user does not have the necessary role to perform create, read or delete operations',
            );
        }
    }
}
