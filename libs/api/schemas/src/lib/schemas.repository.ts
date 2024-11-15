import { ConfigService } from '@nestjs/config';
import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { DynamoDBServiceException } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument, QueryCommandInput, ScanCommandInput, UpdateCommandInput } from '@aws-sdk/lib-dynamodb';
import { Application, SchemaSummary, SchemaVersionState, Version } from '@eai-event-integration-platform/interfaces';

@Injectable()
export class SchemasRepository {
    private readonly logger = new Logger(SchemasRepository.name);
    tableName: string;
    constructor(private configService: ConfigService, private ddbDoc: DynamoDBDocument) {
        this.tableName = configService.getOrThrow<string>('DDB_SCHEMAS_TABLE_NAME');
    }

    // Get Schema
    async getSchema(schemaName: string) {
        this.logger.debug('[getSchema]');
        const params: QueryCommandInput = {
            TableName: this.tableName,
            KeyConditionExpression: '#PK=:PKVal',
            ExpressionAttributeNames: { '#PK': 'PK' },
            ExpressionAttributeValues: { ':PKVal': `SCH#${schemaName}` },
        };

        const { $metadata, ...queryResult } = await this.ddbDoc.query(params);
        if (!queryResult.Items || !queryResult.Items.length) {
            throw new NotFoundException(`Schema '${schemaName} not found`);
        }

        return queryResult.Items;
    }

    // Get latest version data
    async getLatestSchemaVersion(schemaName: string): Promise<Version> {
        this.logger.debug('[getLatestSchemaVersion]');
        const params: QueryCommandInput = {
            TableName: this.tableName,
            ScanIndexForward: false,
            Limit: 1,
            KeyConditionExpression: '#PK = :PK AND begins_with ( #SK, :SK)',
            ExpressionAttributeNames: { '#PK': 'PK', '#SK': 'SK' },
            ExpressionAttributeValues: {
                ':PK': `SCH#${schemaName}`,
                ':SK': 'VER#',
            },
        };
        const { $metadata, ...versionList } = await this.ddbDoc.query(params);

        if (!versionList.Items || !versionList.Items.length) {
            throw new NotFoundException(`Schema '${schemaName} not found`);
        }

        const { PK, SK, Type, ...latestVersion } = versionList.Items[0];

        return latestVersion;
    }

    // get list of all schema details
    async listSchemas(): Promise<SchemaSummary[]> {
        try {
            const allSchemas: SchemaSummary[] = [];
            const query: ScanCommandInput = {
                TableName: this.tableName,
            };

            do {
                const { Items, LastEvaluatedKey } = await this.ddbDoc.scan(query);

                allSchemas.push(
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    ...Items.filter(({ Type }) => Type === 'Schema').map(({ PK, SK, Type, ...rest }) => rest),
                );

                query.ExclusiveStartKey = LastEvaluatedKey;
            } while (query.ExclusiveStartKey);

            return allSchemas;
        } catch (error: unknown) {
            if (error instanceof DynamoDBServiceException) {
                throw new InternalServerErrorException(error.message);
            }
            throw new InternalServerErrorException(error);
        }
    }

    // get all version data
    async listVersions(schemaName: string): Promise<Version[]> {
        const params: QueryCommandInput = {
            TableName: this.tableName,
            KeyConditionExpression: 'PK = :PK AND begins_with ( SK, :SK)',
            ExpressionAttributeValues: {
                ':PK': `SCH#${schemaName}`,
                ':SK': 'VER#',
            },
        };
        const { $metadata, ...versionList } = await this.ddbDoc.query(params);
        return versionList.Items;
    }

    async countVersions(schemaName: string) {
        const params: QueryCommandInput = {
            TableName: this.tableName,
            KeyConditionExpression: 'PK = :PK AND begins_with ( SK, :SK)',
            ExpressionAttributeValues: {
                ':PK': `SCH#${schemaName}`,
                ':SK': 'VER#',
            },
        };
        const result = await this.ddbDoc.query(params);
        return result.Count;
    }

    async createSchema(data: SchemaSummary, schemaName: string) {
        this.logger.debug('[createSchema]');

        try {
            await this.ddbDoc.put({
                TableName: this.tableName,
                Item: {
                    PK: `SCH#${schemaName}`,
                    SK: `SCH#${schemaName}`,
                    Type: 'Schema',
                    ...data,
                },
            });
        } catch (error) {
            this.logger.log('DynamoDB error: ' + JSON.stringify(error));
            if (error instanceof DynamoDBServiceException) {
                throw new InternalServerErrorException(error.message);
            }
            throw new InternalServerErrorException(error);
        }
    }

    async updateSchemaDetails(schema: SchemaSummary) {
        this.logger.debug('[updateSchemaDetails]');

        const itemKeys = Object.keys(schema);

        try {
            await this.ddbDoc.update({
                TableName: this.tableName,
                Key: {
                    PK: `SCH#${schema.SchemaName}`,
                    SK: `SCH#${schema.SchemaName}`,
                },
                UpdateExpression: `SET ${itemKeys.map((k, i) => `#f${i} = :val${i}`).join(', ')}`,
                ExpressionAttributeNames: itemKeys.reduce((acc, cur, i) => ({ ...acc, [`#f${i}`]: cur }), {}),
                ExpressionAttributeValues: itemKeys.reduce(
                    (acc, cur: string, i) => ({ ...acc, [`:val${i}`]: schema[cur as keyof SchemaSummary] }),
                    {},
                ),
            });
        } catch (error) {
            this.logger.log('DynamoDB error: ' + error.message);
            if (error instanceof DynamoDBServiceException) {
                throw new InternalServerErrorException(error.message);
            }
            throw new InternalServerErrorException(error);
        }
    }

    async setSchemaVersionState(schemaName: string, version: string, state: SchemaVersionState) {
        this.logger.debug('[setSchemaVersionState]');
        try {
            await this.ddbDoc.update({
                TableName: this.tableName,
                Key: {
                    PK: `SCH#${schemaName}`,
                    SK: `VER#${version}`,
                },
                UpdateExpression: `SET #s = :s`,
                ExpressionAttributeNames: { '#s': 'State' },
                ExpressionAttributeValues: { ':s': state },
            });
        } catch (error) {
            this.logger.log('DynamoDB error: ' + error.message);
            if (error instanceof DynamoDBServiceException) {
                throw new InternalServerErrorException(error.message);
            }
            throw new InternalServerErrorException(error);
        }
    }

    async createVersion(version: Version, schemaName: string) {
        this.logger.debug('[createVersion]');
        try {
            await this.ddbDoc.put({
                TableName: this.tableName,
                Item: {
                    PK: `SCH#${schemaName}`,
                    SK: `VER#1`,
                    Type: 'Version',
                    ...version,
                },
            });
        } catch (error) {
            this.logger.log('DynamoDB error: ' + JSON.stringify(error));
            if (error instanceof DynamoDBServiceException) {
                throw new InternalServerErrorException(error.message);
            }
            throw new InternalServerErrorException(error);
        }
    }

    // async updateSchemaNewVersion(updateVersionData: Version, schemaName: string) {
    //     await this.ddbDoc.put({
    //         TableName: this.tableName,
    //         Item: {
    //             PK: `SCH#${schemaName}`,
    //             SK: `VER#${updateVersionData.Version}`,
    //             ...updateVersionData,
    //         },
    //     });
    // }

    async saveSchemaVersion(updateVersionData: Version, schemaName: string) {
        this.logger.debug('[saveSchemaVersion]');

        const versionData = {
            ...updateVersionData,
            Type: 'Version',
        };

        // if versions state of current one = drft then increase version map +1 only
        const itemKeys = Object.keys(versionData);

        const command: UpdateCommandInput = {
            TableName: this.tableName,
            Key: {
                PK: `SCH#${schemaName}`,
                SK: `VER#${versionData.Version}`,
            },
            UpdateExpression: `SET ${itemKeys.map((k, i) => `#f${i} = :val${i}`).join(', ')}`,
            ExpressionAttributeNames: itemKeys.reduce((acc, cur, i) => ({ ...acc, [`#f${i}`]: cur }), {}),
            ExpressionAttributeValues: itemKeys.reduce(
                (acc, cur: string, i) => ({ ...acc, [`:val${i}`]: versionData[cur as keyof Version] }),
                {},
            ),
        };
        await this.ddbDoc.update(command);
    }

    // async updateSchemaVersionCount(schemaName: string, count?: number) {
    //     if (!count) {
    //         const versions = await this.listVersions(schemaName);
    //         count = versions.length;
    //     }

    //     const schema: SchemaSummary = {
    //         SchemaName: schemaName,
    //         VersionCount: count,
    //     };
    //     await this.updateSchemaDetails(schema);
    //     return count;
    // }

    async deleteSchema(schemaName: string) {
        this.logger.debug('[deleteSchema]');
        try {
            // delete schema details
            await this.ddbDoc.delete({
                TableName: this.tableName,
                Key: {
                    PK: `SCH#${schemaName}`,
                    SK: `SCH#${schemaName}`,
                },
            });
            // delete schema versions
            const versionList = await this.listVersions(schemaName);
            for (let i = 0; i < versionList?.length; i++) {
                await this.ddbDoc.delete({
                    TableName: this.tableName,
                    Key: {
                        PK: `SCH#${schemaName}`,
                        SK: `VER#${versionList[i].Version}`,
                    },
                });
            }
        } catch (error: unknown) {
            if (error instanceof DynamoDBServiceException) {
                throw new InternalServerErrorException(error.message);
            }
            throw new InternalServerErrorException(error);
        }
    }

    async syncApplicationToSchemas(application: Application) {
        this.logger.debug('[syncApplicationToSchmas]');
        const getSchemasParams: ScanCommandInput = {
            TableName: this.tableName,
            FilterExpression: '#Type =:type and #AppName =:appName',
            ExpressionAttributeNames: { '#Type': 'Type', '#AppName': 'AppName' },
            ExpressionAttributeValues: { ':type': 'Schema', ':appName': application.ShortName },
        };

        const result = await this.ddbDoc.scan(getSchemasParams);
        const schemas = result?.Items ?? [];
        for (const { PK, SK, Type, ...schema } of schemas) {
            const updateSchema: SchemaSummary = {
                ...schema,
                SchemaOwner: application.Owner,
                SchemaSupportGroup: application.ContactEmail,
                CostCode: application.CostCode,
                AppCINumber: application.CINumber,
            };
            const item = Object.entries(updateSchema);
            await this.ddbDoc.update({
                TableName: this.tableName,
                Key: {
                    PK: `SCH#${updateSchema.SchemaName}`,
                    SK: `SCH#${updateSchema.SchemaName}`,
                },
                UpdateExpression: 'SET ' + item.map((_, index) => `#f${index} = :val${index}`),
                ExpressionAttributeNames: Object.fromEntries(item.map((kv, index) => [`#f${index}`, kv[0]])),
                ExpressionAttributeValues: Object.fromEntries(item.map((kv, index) => [`:val${index}`, kv[1]])),
            });
        }
        return { message: 'Successfully Synced Application Details to Schema Table' };
    }
}
