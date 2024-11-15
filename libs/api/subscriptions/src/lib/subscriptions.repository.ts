import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    DynamoDBDocument,
    QueryCommandInput,
    ScanCommandInput,
    ScanCommandOutput,
    UpdateCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { Application, Subscription } from '@eai-event-integration-platform/interfaces';

@Injectable()
export class SubscriptionsRepository {
    private readonly logger = new Logger(SubscriptionsRepository.name);
    tableName: string;

    constructor(private configService: ConfigService, private ddbDoc: DynamoDBDocument) {
        this.tableName = configService.getOrThrow<string>('DDB_SUBSCRIPTIONS_TABLE_NAME');
    }

    async createSubscription(subscription: Subscription) {
        this.logger.debug('[createSubscription]');
        try {
            await this.ddbDoc.put({
                TableName: this.tableName,
                Item: {
                    PK: `SUB#${subscription.Name}`,
                    SK: `SUB#${subscription.Name}`,
                    Type: 'Subscription',
                    ...subscription,
                },
            });
        } catch (error) {
            this.logger.error(`Error creating subscription: ${error}`);
            throw new InternalServerErrorException(error);
        }
    }

    async deleteSubscription(subscription: Subscription) {
        this.logger.debug('[deleteSubscription]');
        try {
            await this.ddbDoc.delete({
                TableName: this.tableName,
                Key: {
                    PK: `SUB#${subscription.Name}`,
                    SK: `SUB#${subscription.Name}`,
                },
            });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    async updateSubscription(subscription: Subscription) {
        this.logger.debug('[updateSubscription]');
        try {
            const itemKeys = Object.keys(subscription);

            const command: UpdateCommandInput = {
                TableName: this.tableName,
                Key: {
                    PK: `SUB#${subscription.Name}`,
                    SK: `SUB#${subscription.Name}`,
                },
                UpdateExpression: `SET ${itemKeys.map((k, i) => `#f${i} = :val${i}`).join(', ')}`,
                ExpressionAttributeNames: itemKeys.reduce((acc, cur, i) => ({ ...acc, [`#f${i}`]: cur }), {}),
                ExpressionAttributeValues: itemKeys.reduce(
                    (acc, cur: string, i) => ({ ...acc, [`:val${i}`]: subscription[cur as keyof Subscription] }),
                    {},
                ),
            };

            await this.ddbDoc.update(command);
        } catch (error) {
            this.logger.error(`Error updating subscription: ${error}`);
            throw new InternalServerErrorException(error);
        }
    }

    async getSubscription(name: string): Promise<Subscription | undefined> {
        this.logger.debug('[getSubscription]');
        try {
            const result = await this.ddbDoc.get({
                TableName: this.tableName,
                Key: {
                    PK: `SUB#${name}`,
                    SK: `SUB#${name}`,
                },
            });

            return result.Item;
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    //TODO
    //Update the naming to be subscription focussed
    async findAllSubscriptions(): Promise<Subscription[]> {
        this.logger.debug('[findAllSubscriptions]');
        try {
            const query: ScanCommandInput = {
                TableName: this.tableName,
                FilterExpression: '#Type =:type',
                ExpressionAttributeNames: { '#Type': 'Type' },
                ExpressionAttributeValues: { ':type': 'Subscription' },
            };

            const result = await this.ddbDoc.scan(query);

            return result.Items ? (result.Items as Subscription[]) : [];
        } catch (error) {
            this.logger.error(`Error finding all subscriptions: ${error}`);
            throw new InternalServerErrorException(error);
        }
    }

    async findAllBySchemaName(schemaName: string): Promise<Subscription[]> {
        this.logger.debug('[findAllBySchemaName]');
        try {
            const query: QueryCommandInput = {
                TableName: this.tableName,
                KeyConditionExpression: '#SchemaName=:SchemaName',
                ExpressionAttributeNames: { '#SchemaName': 'SchemaName' },
                ExpressionAttributeValues: { ':SchemaName': schemaName },
                IndexName: 'SchemaName-PK',
            };

            const result = await this.ddbDoc.query(query);

            return result.Items ? (result.Items as Subscription[]) : [];
        } catch (error) {
            this.logger.error(`Error finding all schema subscription: ${error}`);
            throw new InternalServerErrorException(error);
        }
    }

    async findAllSubscriptionsByUserRoles(roles: string[]): Promise<Subscription[]> {
        this.logger.debug('[findAllSubscriptionsByUserRoles]');
        try {
            const command: ScanCommandInput = {
                TableName: this.tableName,
                FilterExpression:
                    '#Type =:type AND (' + roles.map((r, i) => `#OwnerRole = :val${i}`).join(' OR ') + ')',
                ExpressionAttributeNames: { '#OwnerRole': 'OwnerRole', '#Type': 'Type' },
                ExpressionAttributeValues: {
                    ...roles.reduce((acc, cur, i) => ({ ...acc, [`:val${i}`]: cur }), {}),
                    ':type': 'Subscription',
                },
            };

            const result = await this.ddbDoc.scan(command);

            return result.Items ? (result.Items as Subscription[]) : [];
        } catch (error) {
            this.logger.error(`Error finding all user subscription: ${error}`);
            throw new InternalServerErrorException(error);
        }
    }

    async syncApplicationToSubscriptions(application: Application) {
        this.logger.debug('[syncApplicationToSubscriptions]');

        const getSubscriptionsParams: ScanCommandInput = {
            TableName: this.tableName,
            FilterExpression: '#Type =:type and #AppName =:appName',
            ExpressionAttributeNames: { '#Type': 'Type', '#AppName': 'AppName' },
            ExpressionAttributeValues: { ':type': 'Subscription', ':appName': application.ShortName },
        };
        const result = await this.ddbDoc.scan(getSubscriptionsParams);
        const subscriptions = result?.Items ?? [];
        for (const { PK, SK, Type, ...subscription } of subscriptions) {
            const updateSubscription: Subscription = {
                ...subscription,
                AppCINumber: application.CINumber,
                CostCode: application.CostCode,
                SubscriptionOwner: application.Owner,
            };
            const item = Object.entries(updateSubscription);
            const command: UpdateCommandInput = {
                TableName: this.tableName,
                Key: {
                    PK: `SUB#${updateSubscription.Name}`,
                    SK: `SUB#${updateSubscription.Name}`,
                },
                UpdateExpression: 'SET ' + item.map((_, index) => `#f${index} = :val${index}`),
                ExpressionAttributeNames: Object.fromEntries(item.map((kv, index) => [`#f${index}`, kv[0]])),
                ExpressionAttributeValues: Object.fromEntries(item.map((kv, index) => [`:val${index}`, kv[1]])),
            };
            await this.ddbDoc.update(command);
        }
        return { message: 'Successfully Synced Application Details to Subscription Table' };
    }
}
