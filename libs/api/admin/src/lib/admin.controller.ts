import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Logger, Req, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AzureADGuard, Role, Roles, RolesGuard, AuthUser } from '@eai-event-integration-platform/api/auth';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { BrokerTypes } from '@eai-event-integration-platform/interfaces';
import { EventBridge } from '@aws-sdk/client-eventbridge';
import { STS } from '@aws-sdk/client-sts';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { StateChangedEvent } from '@eai-event-integration-platform/api/events';
import { DeletePermissionDto } from './dto/delete-permission.dto';

@Controller('admin')
@UseGuards(AzureADGuard, RolesGuard)
export class AdminController {
    private readonly logger = new Logger(AdminController.name);

    constructor(
        private config: ConfigService,
        private sts: STS,
        private readonly adminService: AdminService,
        private eventEmitter: EventEmitter2,
    ) {}

    @Post('/permission')
    @Roles(Role.Admin)
    async create(@Body() createPermissionDto: CreatePermissionDto, @Req() request: Request) {
        this.logger.debug('[create]');
        const actor = request.user as AuthUser;
        this.eventEmitter.emit(
            'state-change.requested',
            new StateChangedEvent('admin.create', createPermissionDto, actor.username),
        );
        try {
            const prodResult = await this.adminService.create(createPermissionDto.Prod, BrokerTypes.PRD);
            if (this.config.get('NODE_ENV') === 'production' || this.config.get('NODE_ENV') === 'qa') {
                // nonProd broker being requested, need to assume new role
                await this.setNpEventBridgeClient();
            }
            const npResult = await this.adminService.create(createPermissionDto.NonProd, BrokerTypes.NP);

            return { prodResult, npResult };
        } catch (error: any) {
            this.logger.error(`Error creating permissions: ${error.message}`);
            throw error;
        }
    }

    @Get('/permission')
    @Roles(Role.Admin)
    async findAll(@Query('broker') broker: BrokerTypes) {
        this.logger.debug('[findAll]');
        try {
            return await this.adminService.findAll(broker);
        } catch (error: any) {
            this.logger.error(`Error finding policy document: ${error.message}`);
            throw error;
        }
    }

    @Delete('/permission')
    @Roles(Role.Admin)
    async remove(@Query() query: DeletePermissionDto, @Req() request: Request) {
        this.logger.debug('[create]');
        const actor = request.user as AuthUser;
        this.eventEmitter.emit('state-change.requested', new StateChangedEvent('admin.remove', query, actor.username));
        try {
            const prodResult = await this.adminService.remove(query.statementidPrd, BrokerTypes.PRD);
            if (this.config.get('NODE_ENV') === 'production' || this.config.get('NODE_ENV') === 'qa') {
                // nonProd broker being requested, need to assume new role
                await this.setNpEventBridgeClient();
            }
            const npResult = await this.adminService.remove(query.statementidNp, BrokerTypes.NP);
            return { prodResult, npResult };
        } catch (error: any) {
            this.logger.error(`Error creating permissions: ${error.message}`);
            throw error;
        }
    }

    private async setNpEventBridgeClient() {
        this.logger.debug('[setNpEventBridgeClient]');
        try {
            this.logger.log(`Assuming role for NonProd Account`);
            const roleArn = this.config.get<string>('ASSUME_NP_ROLE_ARN');
            if (!roleArn) {
                throw new Error('No RoleArn provided to assume role for config var ASSUME_NP_ROLE_ARN');
            }
            // get the credentials to assume role in the NP account
            const npAcc = await this.sts.assumeRole({
                RoleArn: roleArn,
                RoleSessionName: 'np-role',
            });

            const ACCESS_KEY = npAcc.Credentials?.AccessKeyId;
            const SECRET_KEY = npAcc.Credentials?.SecretAccessKey;
            const SESSION_TOKEN = npAcc.Credentials?.SessionToken;

            if (!ACCESS_KEY || !SECRET_KEY || !SESSION_TOKEN) {
                throw new Error('Error assuming role, invalid credential values');
            }

            this.adminService.eventBridge = new EventBridge({
                region: 'ap-southeast-2',
                credentials: {
                    accessKeyId: ACCESS_KEY,
                    secretAccessKey: SECRET_KEY,
                    sessionToken: SESSION_TOKEN,
                },
            });
        } catch (error: any) {
            this.logger.error(`Error trying to set EventBridgeClient to assume NonProd Role: ${error.message}`);
            throw error;
        }
    }
}
