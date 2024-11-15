import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DynamoDBDocument, GetCommandInput, QueryCommandInput } from '@aws-sdk/lib-dynamodb';
import { Connection, Destination } from '@eai-event-integration-platform/interfaces';
import { DynamoDBServiceException, ScanCommandInput } from '@aws-sdk/client-dynamodb';

@Injectable()
export class RestTargetsRepository {
    private readonly logger = new Logger(RestTargetsRepository.name);
    tableName: string;

    constructor(private configService: ConfigService, private ddbDoc: DynamoDBDocument) {
        this.tableName = configService.getOrThrow<string>('DDB_SUBSCRIPTIONS_TABLE_NAME');
    }

    async createConnection(connection: Connection) {
        this.logger.debug('[createConnection]');
        try {
            await this.ddbDoc.put({
                TableName: this.tableName,
                Item: {
                    PK: `CON#${connection.ConnectionName}`,
                    SK: `CON#${connection.ConnectionName}`,
                    Type: 'Connection',
                    ...connection,
                },
            });
        } catch (error) {
            this.logger.error(`Error creating connection: ${error}`);
            throw new InternalServerErrorException(error);
        }
    }

    async updateConnection(connection: Connection) {
        this.logger.debug('[updateConnection]');
        const itemKeys = Object.keys(connection);
        try {
            await this.ddbDoc.update({
                TableName: this.tableName,
                Key: {
                    PK: `CON#${connection.ConnectionName}`,
                    SK: `CON#${connection.ConnectionName}`,
                },
                UpdateExpression: `SET ${itemKeys.map((k, i) => `#f${i} = :val${i}`).join(', ')}`,
                ExpressionAttributeNames: itemKeys.reduce((acc, cur, i) => ({ ...acc, [`#f${i}`]: cur }), {}),
                ExpressionAttributeValues: itemKeys.reduce(
                    (acc, cur: string, i) => ({ ...acc, [`:val${i}`]: connection[cur as keyof Connection] }),
                    {},
                ),
            });
        } catch (error) {
            this.logger.error(`Error updating connection: ${error}`);
            throw new InternalServerErrorException(error);
        }
    }

    async updateDestination(connection: Connection, destination: Destination) {
        this.logger.debug('[updateDestination]');
        const item = Object.entries(destination);
        item.push(['Type', 'Destination']);
        try {
            await this.ddbDoc.update({
                TableName: this.tableName,
                Key: {
                    PK: `CON#${connection.ConnectionName}`,
                    SK: `DEST#${destination.DestinationName}`,
                },
                UpdateExpression: 'SET ' + item.map((_, index) => `#f${index} = :val${index}`).join(','),
                ExpressionAttributeNames: Object.fromEntries(item.map((kv, index) => [`#f${index}`, kv[0]])),
                ExpressionAttributeValues: Object.fromEntries(item.map((kv, index) => [`:val${index}`, kv[1]])),
            });
        } catch (error) {
            this.logger.error(`Error updating destination: ${error}`);
            throw new InternalServerErrorException(error);
        }
    }

    async getAll(type: 'Connection' | 'Destination') {
        try {
            const query: ScanCommandInput = {
                TableName: this.tableName,
            };
            const result = await this.ddbDoc.scan(query);
            const allConnections = [];
            if (result.Items) {
                for (const item of result.Items) {
                    if (item.Type === type) {
                        const { PK, SK, Type, ...rest } = item;
                        allConnections.push({ ...rest });
                    }
                }
            }
            return allConnections;
        } catch (error: unknown) {
            if (error instanceof DynamoDBServiceException) {
                throw new InternalServerErrorException(error.message);
            }
            throw new InternalServerErrorException(error);
        }
    }

    async getConnection(conName: string): Promise<Connection> {
        this.logger.debug('[getConnection]');
        const params: GetCommandInput = {
            TableName: this.tableName,
            Key: {
                PK: `CON#${conName}`,
                SK: `CON#${conName}`,
            },
        };
        const { $metadata, ...queryResult } = await this.ddbDoc.get(params);
        if (!queryResult.Item) {
            throw new NotFoundException(`Connection '${conName} not found`);
        }
        return queryResult.Item as Connection;
    }

    async getDestinations(conName: string): Promise<Destination[] | undefined> {
        this.logger.debug('[getDestination]');
        const params: QueryCommandInput = {
            TableName: this.tableName,
            KeyConditionExpression: 'PK = :PK AND begins_with ( SK, :SK)',
            ExpressionAttributeValues: {
                ':PK': `CON#${conName}`,
                ':SK': 'DEST#',
            },
        };
        const { $metadata, ...versionList } = await this.ddbDoc.query(params);
        return versionList.Items;
    }

    async createDestination(destination: Destination, connectionName: string) {
        this.logger.debug('[addDestination]');
        try {
            await this.ddbDoc.put({
                TableName: this.tableName,
                Item: {
                    PK: `CON#${connectionName}`,
                    SK: `DEST#${destination.DestinationName}`,
                    Type: 'Destination',
                    ...destination,
                },
            });
        } catch (error) {
            this.logger.log(`Error creating destination: ${error}`);
            if (error instanceof DynamoDBServiceException) {
                throw new InternalServerErrorException(error.message);
            }
            throw new InternalServerErrorException(error);
        }
    }

    async deleteConnection(conName: string) {
        this.logger.debug('[deleteConnection]');
        try {
            await this.ddbDoc.delete({
                TableName: this.tableName,
                Key: {
                    PK: `CON#${conName}`,
                    SK: `CON#${conName}`,
                },
            });
        } catch (error: unknown) {
            if (error instanceof DynamoDBServiceException) {
                throw new InternalServerErrorException(error.message);
            }
            throw new InternalServerErrorException(error);
        }
    }

    async deleteDestination(conName: string, destName: string) {
        this.logger.debug('[deleteDestination]');
        try {
            await this.ddbDoc.delete({
                TableName: this.tableName,
                Key: {
                    PK: `CON#${conName}`,
                    SK: `DEST#${destName}`,
                },
            });
        } catch (error: unknown) {
            if (error instanceof DynamoDBServiceException) {
                throw new InternalServerErrorException(error.message);
            }
            throw new InternalServerErrorException(error);
        }
    }
}
