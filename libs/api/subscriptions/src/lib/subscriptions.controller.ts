import {
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
    UnauthorizedException,
    UseGuards,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { StateChangedEvent } from '@eai-event-integration-platform/api/events';
import { AuthUser, AzureADGuard, Role, Roles, RolesGuard } from '@eai-event-integration-platform/api/auth';
import { Subscription } from '@eai-event-integration-platform/interfaces';
import { Request } from 'express';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from './dto';

@Controller('subscriptions')
@UseGuards(AzureADGuard, RolesGuard)
export class SubscriptionsController {
    private readonly logger = new Logger(SubscriptionsController.name);

    constructor(private subscriptionsService: SubscriptionsService, private eventEmitter: EventEmitter2) {}

    /**
     *  Creates a subscription in eventbridge
     */
    @Post()
    @Roles(Role.User)
    async create(@Body() createSubscriptionDto: CreateSubscriptionDto, @Req() request: Request) {
        this.logger.debug('[create]');

        const actor = request.user as AuthUser;
        this.eventEmitter.emit(
            'state-change.requested',
            new StateChangedEvent('subscription.create', createSubscriptionDto, actor.username),
        );

        try {
            this.logger.log(`Creating new subscription with: ${JSON.stringify(createSubscriptionDto)}`);

            return await this.subscriptionsService.createSubscription(createSubscriptionDto);
        } catch (error: any) {
            this.logger.error(`Error creating subscription: ${error.message}`);
            throw error;
        }
    }

    @Delete(':name')
    @Roles(Role.Admin)
    async delete(@Param('name') name: string, @Req() request: Request): Promise<Subscription> {
        this.logger.debug('[delete]');

        const actor = request.user as AuthUser;
        this.eventEmitter.emit(
            'state-change.requested',
            new StateChangedEvent('subscription.delete', name, actor.username),
        );

        try {
            this.logger.log(`Deleting subscription with: ${JSON.stringify(name, null, 2)}`);

            // check user can delete
            const existingSubscription = await this.subscriptionsService.getSubscription(name);
            if (!actor.roles.includes(existingSubscription.OwnerRole + '')) {
                throw new UnauthorizedException(`User not allowed to delete ${name}`);
            }

            return await this.subscriptionsService.delete(name);
        } catch (error: any) {
            this.logger.error(`Error deleting subscription: ${error.message}`);
            throw error;
        }
    }

    @Put(':name')
    @Roles(Role.User)
    async update(
        @Param('name') name: string,
        @Body() updateSubscriptionDto: UpdateSubscriptionDto,
        @Req() request: Request,
    ): Promise<Subscription> {
        this.logger.debug('[update]');

        const actor = request.user as AuthUser;
        this.eventEmitter.emit(
            'state-change.requested',
            new StateChangedEvent('subscription.update', updateSubscriptionDto, actor.username),
        );

        try {
            this.logger.log(`Updating subscription with: ${JSON.stringify(updateSubscriptionDto, null, 2)}`);

            // check user can edit
            const existingSubscription = await this.subscriptionsService.getSubscription(name);
            if (!actor.roles.includes(existingSubscription.OwnerRole + '')) {
                throw new UnauthorizedException(`User not allowed to edit ${name}`);
            }

            return await this.subscriptionsService.updateSubscription(name, updateSubscriptionDto);
        } catch (error: any) {
            this.logger.error(`Error creating subscription: ${error.message}`);
            throw error;
        }
    }

    /**
     *  Gets Event Rules in eventbridge
     */
    @Get()
    async listSubscriptions(
        @Query('schema-name') schemaName?: string,
        @Query('user-owned', new DefaultValuePipe(false), ParseBoolPipe) userOwned?: boolean,
    ): Promise<Subscription[]> {
        this.logger.debug('[listSubscriptions]');
        try {
            return await this.subscriptionsService.getSubscriptions(schemaName, userOwned);
        } catch (error: any) {
            this.logger.error(`Error listing rules: ${error.message}`);
            throw error;
        }
    }

    /**
     *  Gets Event Targets from rule name in eventbridge
     */
    @Get(':name')
    async getSubscription(@Param('name') name: string): Promise<Subscription> {
        this.logger.debug('[getSubscription]');
        try {
            this.logger.log(`Getting subscription "${name}"`);
            return await this.subscriptionsService.getSubscription(name);
        } catch (error: any) {
            this.logger.error(`Error getting Rule details: ${error.message}`);
            throw error;
        }
    }
}
