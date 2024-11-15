import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    CreateSchemaCommandInput,
    DescribeSchemaCommand,
    DescribeSchemaCommandInput,
    Schemas,
    SchemasServiceException,
    UpdateSchemaCommandInput,
    UpdateSchemaResponse,
} from '@aws-sdk/client-schemas';
import { CreateSchemaDto, UpdateSchemaDto } from './dto';

@Injectable()
export class SchemasInfrastructure {
    private readonly logger = new Logger(SchemasInfrastructure.name);
    private registryName?: string;

    constructor(public schemas: Schemas, private configService: ConfigService) {
        this.registryName = configService.getOrThrow<string>('SCHEMA_REGISTRY_NAME');
    }

    async findSchema(schemaName: string) {
        this.logger.debug('[findSchema]');
        this.logger.log(`Getting schema for ${schemaName}`);
        try {
            //attempt to get schema
            const params: DescribeSchemaCommandInput = {
                RegistryName: this.registryName,
                SchemaName: schemaName,
            };
            return await this.schemas.describeSchema(params);
        } catch (error: unknown) {
            this.logger.error(`Error getting schema: ${JSON.stringify(error)}`);
            throw new InternalServerErrorException(error);
        }
    }

    async createSchema(schema: CreateSchemaDto) {
        this.logger.debug('[createSchema]');
        this.logger.log(`Creating new schema (${schema.SchemaName}) in AWS`);
        this.logger.log('what is my schema' + JSON.stringify(schema));
        try {
            // attempt to create Schema
            const params: CreateSchemaCommandInput = {
                Content: schema.Content,
                Description: schema.Description,
                SchemaName: schema.SchemaName,
                RegistryName: this.registryName,
                Type: 'JSONSchemaDraft4',
            };
            return await this.schemas.createSchema(params);
        } catch (error: unknown) {
            this.logger.error(`Error creating schema: ${JSON.stringify(error)}`);
            throw new InternalServerErrorException(error);
        }
    }

    async updateSchema(schema: UpdateSchemaDto): Promise<UpdateSchemaResponse> {
        this.logger.debug('[updateSchema]');
        this.logger.log(`Updating existing schema ${schema.SchemaName} in AWS`);
        try {
            // attempt at updating schema
            const params: UpdateSchemaCommandInput = {
                Content: schema.Content,
                Description: schema.Description,
                SchemaName: schema.SchemaName,
                RegistryName: this.registryName,
                Type: 'JSONSchemaDraft4',
            };
            const { $metadata, ...schemaResult } = await this.schemas.updateSchema(params);
            return schemaResult;
        } catch (error: unknown) {
            this.logger.error(`Error updating schema: ${JSON.stringify(error)}`);
            if (error instanceof SchemasServiceException) {
                if (error.name === 'Conflict') {
                    const { $metadata, ...schemaResult } = await this.findSchema(schema.SchemaName);
                    return schemaResult;
                }
            }
            throw new InternalServerErrorException(error);
        }
    }

    async deleteSchema(schemaName: string) {
        this.logger.debug('[deleteSchema]');
        this.logger.log(`Deleting schema ${schemaName} in AWS.`);
        try {
            // attempt at deleting schema
            return await this.schemas.deleteSchema({
                RegistryName: this.registryName,
                SchemaName: schemaName,
            });
        } catch (error: unknown) {
            this.logger.error(`Error deleting schema: ${JSON.stringify(error)}`);
            throw new InternalServerErrorException(error);
        }
    }
}
