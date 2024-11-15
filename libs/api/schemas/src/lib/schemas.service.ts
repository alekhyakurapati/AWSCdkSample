import {
    CloudWatchLogsClient,
    GetQueryResultsCommand,
    StartQueryCommand,
    StopQueryCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import { SchemasServiceException } from '@aws-sdk/client-schemas';
import { Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { compile } from 'json-schema-to-typescript';

import { AuthUser } from '@eai-event-integration-platform/api/auth';
import { SubscriptionsService } from '@eai-event-integration-platform/api/subscriptions';
import {
    Application,
    AvailableVersions,
    BrokerTypes,
    SchemaDetails,
    SchemaSummary,
    SchemaVersionState,
    Version,
} from '@eai-event-integration-platform/interfaces';
import { generateChangedBy } from '@eai-event-integration-platform/utils';
import { DateTime } from 'luxon';

import { CreateSchemaDto, UpdateSchemaDto } from './dto';
import { SchemasInfrastructure } from './schemas.infrastructure';
import { SchemasRepository } from './schemas.repository';
import * as lodash from 'lodash';

@Injectable(/* { scope: Scope.REQUEST } */)
export class SchemasService {
    private readonly logger = new Logger(SchemasService.name);

    constructor(
        private schemaInfrastructure: SchemasInfrastructure,
        private schemaRepository: SchemasRepository,
        private subscriptionsService: SubscriptionsService,
        private cloudWatchLogsClient: CloudWatchLogsClient,
        @Inject(REQUEST) private request: Request,
    ) {}

    /**
     * Finds all schemas in a schema registry
     */
    listSchemas(): Promise<SchemaSummary[]> {
        // new
        return this.schemaRepository.listSchemas();
    }

    /**
     * Finds a schema specified by name and optional version
     */
    async getSchema(name: string, version?: string): Promise<SchemaDetails> {
        this.logger.debug('[getSchema]');
        this.logger.log(`Fetching single schema ${name + (version ? ':' + version : '')} from AWS`);

        let schema: SchemaDetails;
        let curVersion: Version;
        const versions: Version[] = [];

        // retrieve data for schema
        const ddbResult = await this.schemaRepository.getSchema(name);

        for (const item of ddbResult) {
            const { PK, SK, Type, ...rest } = item;
            if (item.Type === 'Schema') {
                schema = {
                    ...(rest as SchemaDetails),
                };
            } else if (item.Type === 'Version') {
                versions.push(rest);
            }
        }

        if (!version) {
            // return the latest version
            curVersion = versions[versions.length - 1];
        } else {
            // return the specified version
            const foundVersions = versions.filter((v) => +v.Version! === +version);
            if (!foundVersions.length) {
                throw new NotFoundException(`Version ${version} for schema ${name} was not found`);
            }
            curVersion = foundVersions[0];
        }

        // schema.AvailableVersions = versions.reduce((a, c) => ({ ...a, [c.Version]: c.State }), {} as AvailableVersions);
        const mergedSchema = { ...schema, ...curVersion };

        // Hack to get this deployed - if the LastUpdated in the schema model is later than the curVersion model, use that
        if (new Date(schema.LastUpdated).getTime() > new Date(curVersion.LastUpdated).getTime()) {
            mergedSchema.LastUpdated = schema.LastUpdated;
            mergedSchema.LastUpdatedBy = schema.LastUpdatedBy;
        }

        return mergedSchema;
    }

    /**
     * Finds all versions of a schema
     */
    listSchemaVersions(schemaName: string): Promise<Version[]> {
        return this.schemaRepository.listVersions(schemaName);
    }

    /**
     * Finds a schema specified by name and optional version
     */
    async getSchemaWithSubscriptions(name: string, version?: string, broker = BrokerTypes.PRD): Promise<SchemaDetails> {
        this.logger.debug('[getSchemaWithSubscriptions]');
        this.logger.log(`Fetching single schema ${name + (version ? ':v' + version : '')} from AWS with subscriptions`);
        const schema = await this.getSchema(name, version);
        schema.Subscriptions = await this.subscriptionsService.getSchemaSubscriptions(name);
        return schema;
    }

    /**
     * Creates a new schema in eventbridge
     */
    async create(createSchemaDto: CreateSchemaDto): Promise<SchemaDetails> {
        // create schema in EventBridge schemas
        const createSchemaResult = await this.schemaInfrastructure.createSchema(createSchemaDto);

        // create schema in Dynamo DB schemas table
        const userIdentity = generateChangedBy(this.request.user as AuthUser);
        const { Content, ...schemaData } = createSchemaDto;
        // Add schema data to dynamo db
        const schemaObject: SchemaSummary = {
            ...schemaData,
            SchemaArn: createSchemaResult.SchemaArn,
            SchemaType: createSchemaResult.Type,
            VersionCount: 1,
            AvailableVersions: { '1': SchemaVersionState.DRFT },
            CreatedBy: userIdentity,
            LastUpdatedBy: userIdentity,
            LastUpdated: createSchemaResult.LastModified.toISOString(),
        };
        // Add schema version data to dynamo db
        const versionObject: Version = {
            Content: Content,
            State: SchemaVersionState.DRFT,
            AWSVersion: createSchemaResult.SchemaVersion,
            Version: createSchemaResult.SchemaVersion,
            VersionCreatedDate: createSchemaResult.VersionCreatedDate?.toISOString(),
            LastUpdatedBy: userIdentity,
            LastUpdated: createSchemaResult.VersionCreatedDate?.toISOString(),
        };
        await this.schemaRepository.createSchema(schemaObject, createSchemaDto.SchemaName);
        await this.schemaRepository.createVersion(versionObject, createSchemaDto.SchemaName);

        return {
            ...schemaObject,
            ...versionObject,
        };
    }

    /**
     * Updates a schema in the registry
     */
    async update(updateSchemaDto: UpdateSchemaDto): Promise<SchemaDetails> {
        const userIdentity = generateChangedBy(this.request.user as AuthUser);
        // Update in Eventbridge Schemas and Dynamodb
        try {
            const schemaResult = await this.schemaInfrastructure.updateSchema(updateSchemaDto);

            // TODO:check if Content is different to avoid update/create versions
            // Create Version update object
            const latestVersion = await this.schemaRepository.getLatestSchemaVersion(updateSchemaDto.SchemaName);
            this.logger.debug('what is my latest version' + JSON.stringify(latestVersion));

            let updateVersionData: Version = {
                LastUpdatedBy: userIdentity,
                LastUpdated: schemaResult.VersionCreatedDate.toISOString(),
            };

            const { examples: lastVersionExamples, ...lastVersionContent } = JSON.parse(latestVersion.Content);
            const { examples: updateSchemaDtoExamples, ...updateSchemaDtoContent } = JSON.parse(
                updateSchemaDto.Content,
            );

            if (!lodash.isEqual(lastVersionContent, updateSchemaDtoContent)) {
                this.logger.debug('Content has changed');
                if (latestVersion.State === SchemaVersionState.PUBL) {
                    // if version state of current one = publ then insert new item, State at drft and AWSVersion +1 and Version +1
                    this.logger.debug('trying to update for a publ');
                    updateVersionData = {
                        ...updateVersionData,
                        State: SchemaVersionState.DRFT,
                        AWSVersion: parseInt(schemaResult.SchemaVersion).toString(),
                        Version: (parseInt(latestVersion.Version) + 1).toString(),
                        Content: updateSchemaDto.Content,
                        VersionCreatedDate: schemaResult.VersionCreatedDate.toISOString(),
                    };
                } else if (latestVersion.State === SchemaVersionState.DRFT) {
                    this.logger.debug('trying to update for a drft');
                    // if versions state of current one = drft then increase version map +1 only
                    updateVersionData = {
                        ...updateVersionData,
                        Version: latestVersion.Version,
                        AWSVersion: parseInt(schemaResult.SchemaVersion).toString(),
                        Content: updateSchemaDto.Content,
                    };
                }

                await this.schemaRepository.saveSchemaVersion(updateVersionData, updateSchemaDto.SchemaName);
            } else if (!lodash.isEqual(lastVersionExamples, updateSchemaDtoExamples)) {
                this.logger.debug('Only example changed, no need to increment version.');
                updateVersionData = {
                    ...updateVersionData,
                    Version: latestVersion.Version,
                    AWSVersion: parseInt(schemaResult.SchemaVersion).toString(),
                    Content: updateSchemaDto.Content,
                };
                await this.schemaRepository.saveSchemaVersion(updateVersionData, updateSchemaDto.SchemaName);
            }

            const versions = await this.schemaRepository.listVersions(updateSchemaDto.SchemaName);

            // Update Schema update object
            const schema: SchemaSummary = {
                ...updateSchemaDto,
                VersionCount: versions.length,
                AvailableVersions: versions.reduce((a, c) => ({ ...a, [c.Version]: c.State }), {} as AvailableVersions),
                SchemaArn: schemaResult.SchemaArn,
                SchemaType: schemaResult.Type,
                LastUpdatedBy: userIdentity,
                LastUpdated: schemaResult.LastModified.toISOString(),
                EventClassification: updateSchemaDto.EventClassification,
            };

            // update schema in ddb
            await this.schemaRepository.updateSchemaDetails(schema);

            return {
                ...schema,
                ...latestVersion,
                ...updateVersionData,
            };
        } catch (error: unknown) {
            this.logger.error(`Error updating schema: ${error}`);
            if (error instanceof SchemasServiceException) {
                if (error.name === 'Conflict') {
                    return await this.getSchema(updateSchemaDto.SchemaName);
                }
                throw new InternalServerErrorException(error.message);
            }
            throw new InternalServerErrorException(error);
        }
    }

    async publishSchema(schemaName: string) {
        this.logger.debug(['publishSchema']);
        this.logger.log(`Publishing ${schemaName}`);
        const schemaVersions = await this.schemaRepository.listVersions(schemaName);
        const userIdentity = generateChangedBy(this.request.user as AuthUser);

        // TODO: ensure use can only publish a draft version, not a deprecated one
        const lastVersion = schemaVersions[schemaVersions.length - 1];
        for (const ver of schemaVersions) {
            ver.State = ver.Version === lastVersion.Version ? SchemaVersionState.PUBL : SchemaVersionState.DEPR;
            await this.schemaRepository.setSchemaVersionState(schemaName, ver.Version, ver.State);
        }

        await this.schemaRepository.updateSchemaDetails({
            SchemaName: schemaName,
            LastUpdatedBy: userIdentity,
            LastUpdated: new Date().toISOString(),
            AvailableVersions: schemaVersions.reduce(
                (a, c) => ({ ...a, [c.Version]: c.State }),
                {} as AvailableVersions,
            ),
        });
    }

    async getRecentEvents(eventSource: string, eventName: string, hours: number) {
        this.logger.debug('[getRecentEvents]');

        const fields = '@timestamp, @message, @logStream';
        const filter = `level="DEBUG" and event.source="${eventSource}" and \`event.detail-type\`="${eventName}"`;
        const sort = '@timestamp desc ';
        const display =
            '@timestamp, event.source, `event.detail-type`, event.detail.Metadata.Version, @message, @logStream';
        const limit = 10;

        const sleep = (ms: number) => {
            return new Promise((resolve) => setTimeout(resolve, ms));
        };

        // Create query
        const now = DateTime.now();
        const queryParams = {
            logGroupName: '/aws/lambda/EAI-EventBroker-EventLogger-PRD',
            startTime: now.minus({ hours }).toUnixInteger(),
            endTime: now.toUnixInteger(),
            queryString: `fields ${fields}| filter ${filter} | sort ${sort} | display ${display}`,
            limit,
        };
        const startCommand = new StartQueryCommand(queryParams);
        const startResponse = await this.cloudWatchLogsClient.send(startCommand);

        // Get query results
        const input = {
            queryId: startResponse.queryId,
        };
        const queryCommand = new GetQueryResultsCommand(input);
        let queryResponse = await this.cloudWatchLogsClient.send(queryCommand);

        // Poll query results
        while (
            queryResponse.status === 'Scheduled' ||
            (queryResponse.results.length < limit && queryResponse.status === 'Running')
        ) {
            await sleep(1000);
            queryResponse = await this.cloudWatchLogsClient.send(queryCommand);
        }

        // Stop query early if limit is already filled
        if (queryResponse.results.length >= limit && queryResponse.status === 'Running') {
            const stopCommand = new StopQueryCommand(input);
            await this.cloudWatchLogsClient.send(stopCommand);
        }
        // Throw an error if query fails
        else if (queryResponse.status === 'Failed') {
            const { httpStatusCode, attempts } = queryResponse.$metadata;
            throw new Error(`HTTP ${httpStatusCode}: failed querying events after ${attempts} attemp(s)`);
        }

        return queryResponse.results
            ?.flatMap((entry) => entry.filter(({ field }) => field === '@message'))
            .map(({ value }) => JSON.parse(value).event);
    }

    async delete(schemaName: string) {
        // Check for role match
        await this.schemaInfrastructure.deleteSchema(schemaName);
        await this.schemaRepository.deleteSchema(schemaName);
    }

    /**
     * Downloads a Schema code binding for a specific version
     */
    async downloadCodeBinding(name: string, version?: string): Promise<string> {
        const options = {
            format: true,
            additionalProperties: false,
        };
        const existingSchema = await this.getSchema(name, version);
        const schema = compile(JSON.parse(existingSchema?.Content || ''), name, options).then((ts) => ts);
        return schema;
    }

    /***
     * Update application details in Schema table
     */
    async syncApplicationToSchemas(application: Application) {
        return await this.schemaRepository.syncApplicationToSchemas(application);
    }
}
