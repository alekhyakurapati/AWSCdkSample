import { Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { EventBridge } from '@aws-sdk/client-eventbridge';
import { Request } from 'express';

import { AuthUser } from '@eai-event-integration-platform/api/auth';
import { AwsService } from '@eai-event-integration-platform/api/aws';
import { Application, BrokerTypes, Subscription } from '@eai-event-integration-platform/interfaces';
import { generateChangedBy } from '@eai-event-integration-platform/utils';

import { CreateSubscriptionDto, UpdateSubscriptionDto } from './dto';
import { SubscriptionsInfrastructure } from './subscriptions.infrastructure';
import { SubscriptionsRepository } from './subscriptions.repository';

@Injectable()
export class SubscriptionsService {
    private readonly logger = new Logger(SubscriptionsService.name);

    constructor(
        @Inject(REQUEST) private request: Request,
        private configService: ConfigService,
        private awsService: AwsService,
        private subscriptionInfrastructure: SubscriptionsInfrastructure,
        private subscriptionRepository: SubscriptionsRepository,
    ) {}

    async getSubscription(name: string) {
        this.logger.debug('[getSubscription]');
        const subscription = await this.subscriptionRepository.getSubscription(name);
        if (!subscription) {
            throw new NotFoundException(`Subscription '${name}' not found`);
        }
        return subscription;
    }

    getSubscriptions(schemaName?: string, userOwned?: boolean): Promise<Subscription[]> {
        this.logger.debug('[getSubscriptions]');
        if (userOwned) {
            this.logger.log(`Getting subscriptions for logged in user`);
            return this.getUserOwnedSubscriptions();
        }

        if (schemaName) {
            this.logger.log(`Getting subscriptions for ${schemaName}`);
            return this.getSchemaSubscriptions(schemaName);
        }

        this.logger.log(`Getting all subscriptions`);
        return this.getAllSubscriptions();
    }

    getAllSubscriptions(): Promise<Subscription[]> {
        this.logger.debug('[getAllSubscriptions]');
        return this.subscriptionRepository.findAllSubscriptions();
    }

    getSchemaSubscriptions(schemaName: string): Promise<Subscription[]> {
        this.logger.debug('[getSchemaSubscriptions]');
        return this.subscriptionRepository.findAllBySchemaName(schemaName);
    }

    getUserOwnedSubscriptions(): Promise<Subscription[]> {
        this.logger.debug('[getUserOwnedSubscriptions]');
        const user = this.request.user as AuthUser;
        const roles = user.roles.filter((r) => r.startsWith('Event.User'));

        return this.subscriptionRepository.findAllSubscriptionsByUserRoles(roles);
    }

    async createSubscription(createSubscriptionDTO: CreateSubscriptionDto): Promise<Subscription> {
        this.logger.debug('[createSubscription]');

        const user = generateChangedBy(this.request.user as AuthUser);

        const subscription: Subscription = {
            ...createSubscriptionDTO,
            Name: this.generateRuleName(createSubscriptionDTO),
            CreatedBy: user,
            LastUpdated: new Date().toISOString(),
            LastUpdatedBy: user,
        };

        await this.checkEnvironment(createSubscriptionDTO.Broker);
        const subscriptionResult = await this.subscriptionInfrastructure.createSubscription(subscription);

        // add entry to DDB
        await this.subscriptionRepository.createSubscription(subscriptionResult);

        return subscriptionResult;
    }

    async delete(name: string): Promise<Subscription> {
        this.logger.debug('[delete]');
        const subscription = await this.getSubscription(name);

        if (!subscription.Broker) {
            throw new InternalServerErrorException('Subscription does not have a Broker');
        }
        await this.checkEnvironment(subscription.Broker);
        const subscriptionResult = await this.subscriptionInfrastructure.deleteSubscription(subscription);

        // now delete from, the database
        await this.subscriptionRepository.deleteSubscription(subscriptionResult);
        return subscriptionResult;
    }

    async updateSubscription(name: string, updateSubscriptionDTO: UpdateSubscriptionDto): Promise<Subscription> {
        this.logger.debug('[updateSubscription]');

        // const eventBusName = this.getEventBusName(updateSubscriptionDTO.Broker);
        const user = this.request.user as AuthUser;

        const subscription: Subscription = {
            ...updateSubscriptionDTO,
            Name: name,
            LastUpdated: new Date().toISOString(),
            LastUpdatedBy: `${user.name} <${user.username}>`,
        };

        await this.checkEnvironment(updateSubscriptionDTO.Broker);
        const subscriptionResult = await this.subscriptionInfrastructure.updateSubscription(subscription);

        // now update the database
        await this.subscriptionRepository.updateSubscription(subscriptionResult);

        return subscriptionResult;
    }

    private async checkEnvironment(broker: BrokerTypes) {
        this.logger.debug('[checkEnvironment]');
        const env = this.configService.getOrThrow('NODE_ENV');
        if ((env === 'production' || env === 'qa') && broker === BrokerTypes.NP) {
            // nonProd broker being requested, need to assume new role for non-prod aws account
            await this.setNpEventBridgeClient();
        }
    }

    private async setNpEventBridgeClient() {
        this.logger.debug('[setNpEventBridgeClient]');
        try {
            const creds = await this.awsService.assumeNonProdRole();

            this.subscriptionInfrastructure.eventBridge = new EventBridge({
                region: 'ap-southeast-2',
                credentials: {
                    accessKeyId: creds.AccessKeyId + '',
                    secretAccessKey: creds.SecretAccessKey + '',
                    sessionToken: creds.SessionToken,
                },
            });
        } catch (error: any) {
            this.logger.error(`Error trying to set EventBridgeClient to assume NonProd Role: ${error.message}`);
            throw error;
        }
    }

    private generateRuleName(subscriptionDTO: CreateSubscriptionDto): string {
        const [domain, eventName] = subscriptionDTO.SchemaName.split('@');
        const unique = Math.random().toString(36).slice(8);
        return `${subscriptionDTO.AppName}.${domain.split('.').pop()}.${eventName}`.slice(0, 59) + `.${unique}`;
    }

    async syncApplicationToSubscriptions(application: Application) {
        return await this.subscriptionRepository.syncApplicationToSubscriptions(application);
    }
}
