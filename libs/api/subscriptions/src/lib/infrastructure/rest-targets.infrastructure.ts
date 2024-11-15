import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import {
    CreateApiDestinationCommandInput,
    CreateConnectionCommandInput,
    EventBridge,
    UpdateApiDestinationCommandInput,
    UpdateConnectionCommandInput,
    EventBridgeServiceException,
    DescribeConnectionCommandInput,
    ConnectionOAuthHttpMethod,
    ApiDestinationHttpMethod,
} from '@aws-sdk/client-eventbridge';
import { Connection, Destination } from '@eai-event-integration-platform/interfaces';

@Injectable()
export class RestTargetsInfrastructure {
    private readonly logger = new Logger(RestTargetsInfrastructure.name);

    constructor(public eventBridge: EventBridge) {}

    async getConnectionAuthStatus(conName: string) {
        this.logger.debug('[getConnectionAuthStatus]');
        try {
            this.logger.log(`Getting auth status for ${conName}.`);
            const describeConnectionCommandInput: DescribeConnectionCommandInput = {
                Name: conName,
            };
            const result = await this.eventBridge.describeConnection(describeConnectionCommandInput);
            return { AuthStatus: result.ConnectionState ?? '' };
        } catch (error: any) {
            this.logger.error(`Error getting connection status: ${JSON.stringify(error)}`);
            throw error;
        }
    }

    async createConnection(connection: Connection): Promise<Connection> {
        this.logger.debug('[createConnection]');
        try {
            // attempt to create connection
            this.logger.log(`Creating connection ${connection.ConnectionName} in ${connection.Broker} environment`);

            const connectionRequest: CreateConnectionCommandInput = {
                Name: connection.ConnectionName,
                Description: connection.Description,
                AuthorizationType: 'OAUTH_CLIENT_CREDENTIALS',
                AuthParameters: {
                    OAuthParameters: {
                        ClientParameters: { ClientID: connection.ClientID, ClientSecret: connection.ClientSecret },
                        AuthorizationEndpoint: connection.AuthorizationEndpoint,
                        HttpMethod: connection.HttpMethod as ConnectionOAuthHttpMethod,
                        OAuthHttpParameters: {
                            BodyParameters: [
                                {
                                    Key: 'scope',
                                    Value: connection.Scope,
                                    IsValueSecret: false,
                                },
                                {
                                    Key: 'grant_type',
                                    Value: 'client_credentials',
                                    IsValueSecret: false,
                                },
                            ],
                        },
                    },
                },
            };

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { ClientSecret, ...connectionData } = connection;

            this.logger.log(`Saving connection with params: ${JSON.stringify(connectionData)}`);
            const result = await this.eventBridge.createConnection(connectionRequest);
            this.logger.log(`Created connection: ${JSON.stringify(result.ConnectionArn)}`);
            delete connection.ClientSecret;

            return {
                ...connection,
                ConnectionArn: result.ConnectionArn,
                ConnectionState: result.ConnectionState,
                LastUpdated: result.LastModifiedTime?.toISOString(),
            };
        } catch (error: unknown) {
            // in case the error happened on the create connection, we need to delete the connection
            this.logger.error(`Error creating connection: ${JSON.stringify(error)}. Deleting connection`);
            if (error instanceof EventBridgeServiceException) {
                switch (error.name) {
                    case 'ResourceAlreadyExistsException':
                        throw new BadRequestException(error.message);
                    default:
                        throw new InternalServerErrorException(error.message);
                }
            }
            throw error;
        }
    }

    async updateConnection(connection: Connection): Promise<Connection> {
        this.logger.debug('[updateConnection]');
        try {
            // attempt to update connection
            this.logger.log(`Updating connection ${connection.ConnectionName} in ${connection.Broker} environment`);

            const connectionRequest: UpdateConnectionCommandInput = {
                Name: connection.ConnectionName,
                Description: connection.Description,
                AuthorizationType: 'OAUTH_CLIENT_CREDENTIALS',
                AuthParameters: {
                    OAuthParameters: {
                        ClientParameters: { ClientID: connection.ClientID, ClientSecret: connection.ClientSecret },
                        AuthorizationEndpoint: connection.AuthorizationEndpoint,
                        HttpMethod: connection.HttpMethod as ConnectionOAuthHttpMethod,
                        OAuthHttpParameters: {
                            BodyParameters: [
                                {
                                    Key: 'scope',
                                    Value: connection.Scope
                                        ? connection.Scope
                                        : `api://${connection.ClientID}/.default`,
                                    IsValueSecret: false,
                                },
                                {
                                    Key: 'grant_type',
                                    Value: 'client_credentials',
                                    IsValueSecret: false,
                                },
                            ],
                        },
                    },
                },
            };
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { ClientSecret, ...connectionData } = connection;
            this.logger.log(`Updating connection with params: ${JSON.stringify(connectionData)}`);
            const result = await this.eventBridge.updateConnection(connectionRequest);
            this.logger.log(`Updated connection: ${JSON.stringify(result.ConnectionArn)}`);
            delete connection.ClientSecret;

            return {
                ...connection,
                ConnectionArn: result.ConnectionArn,
                ConnectionState: result.ConnectionState,
                LastUpdated: result.LastModifiedTime?.toISOString(),
            };
        } catch (error: unknown) {
            // in case the error happened on the update connection, we need to delete the connection
            this.logger.error(`Error updating connection: ${JSON.stringify(error)}. Deleting connection`);
            throw new InternalServerErrorException(error);
        }
    }

    async createDestination(destination: Destination, ConnectionArn: string): Promise<Destination> {
        this.logger.debug('[createDestination]');
        try {
            // attempt to create Destination
            this.logger.log(`Creating destination ${destination.DestinationName} in ${destination.Broker} environment`);

            const destinationRequest: CreateApiDestinationCommandInput = {
                Name: destination.DestinationName,
                Description: destination.Description,
                InvocationEndpoint: destination.InvocationEndpoint,
                HttpMethod: destination.HttpMethod as ApiDestinationHttpMethod,
                InvocationRateLimitPerSecond: destination.InvocationRateLimitPerSecond,
                ConnectionArn: ConnectionArn,
            };
            const result = await this.eventBridge.createApiDestination(destinationRequest);

            return {
                ...destination,
                DestinationArn: result.ApiDestinationArn,
                DestinationState: result.ApiDestinationState,
                LastUpdated: result.LastModifiedTime?.toISOString(),
            };
        } catch (error: unknown) {
            // in case the error happened on the create destination, we need to delete the destination
            if (error instanceof EventBridgeServiceException) {
                switch (error.name) {
                    case 'ResourceAlreadyExistsException':
                        throw new BadRequestException(error.message);
                    default:
                        throw new InternalServerErrorException(error.message);
                }
            }
            throw error;
        }
    }

    async updateDestination(destination: Destination, ConnectionArn: string): Promise<Destination> {
        this.logger.debug('[updateDestination]');
        try {
            // attempt to update Destination
            this.logger.log(`Updating destination ${destination.DestinationName} in ${destination.Broker} environment`);

            const destinationRequest: UpdateApiDestinationCommandInput = {
                Name: destination.DestinationName,
                Description: destination.Description,
                InvocationEndpoint: destination.InvocationEndpoint,
                HttpMethod: destination.HttpMethod as ApiDestinationHttpMethod,
                InvocationRateLimitPerSecond: destination.InvocationRateLimitPerSecond,
                ConnectionArn: ConnectionArn,
            };
            const result = await this.eventBridge.updateApiDestination(destinationRequest);

            return {
                ...destination,
                DestinationArn: result.ApiDestinationArn,
                DestinationState: result.ApiDestinationState,
                LastUpdated: result.LastModifiedTime?.toISOString(),
            };
        } catch (error: unknown) {
            // in case the error happened on the update destination, we need to delete the destination
            this.logger.error(`Error updating destination: ${JSON.stringify(error)}. Deleting destination`);
            throw new InternalServerErrorException(error);
        }
    }

    async deleteConnection(conName: string) {
        this.logger.debug('[deleteConnection]');
        try {
            // attempt to delete Destination
            return await this.eventBridge.deleteConnection({
                Name: conName,
            });
        } catch (error) {
            this.logger.error(`Error deleting connection: ${JSON.stringify(error)}.`);
            throw error;
        }
    }

    async deleteDestination(destName: string) {
        this.logger.debug('[deleteDestination]');
        try {
            // attempt to delete Destination
            return await this.eventBridge.deleteApiDestination({
                Name: destName,
            });
        } catch (error) {
            this.logger.error(`Error deleting destination: ${JSON.stringify(error)}.`);
            throw error;
        }
    }
}
