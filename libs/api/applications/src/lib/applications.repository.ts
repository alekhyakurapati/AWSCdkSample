import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DynamoDBDocument, PutCommandInput, GetCommandInput, ScanCommandInput } from '@aws-sdk/lib-dynamodb';
import { ApplicationAwsAccounts } from '@eai-event-integration-platform/interfaces';
import { CreateApplicationDto, UpdateApplicationDto } from './dto';
import { Application } from '@eai-event-integration-platform/interfaces';

@Injectable()
export class ApplicationsRepository {
    private readonly logger = new Logger(ApplicationsRepository.name);
    tableName: string;

    constructor(private configService: ConfigService, private ddbDoc: DynamoDBDocument) {
        this.tableName = configService.getOrThrow<string>('DDB_APPLICATIONS_TABLE_NAME');
    }

    async getApplication(name: string): Promise<Application> {
        this.logger.debug('[getApplication]');
        try {
            const params: GetCommandInput = {
                TableName: this.tableName,
                Key: {
                    PK: name,
                },
            };
            const result = await this.ddbDoc.get(params);
            return result.Item as Application;
        } catch (error) {
            this.logger.error(`Error finding application: ${error}`);
            throw new InternalServerErrorException(error);
        }
    }

    async findAllApplicationsByUserRoles(roles: string[]): Promise<Application[]> {
        this.logger.debug('[findAllApplicationsByUserRoles]');
        try {
            const command: ScanCommandInput = {
                TableName: this.tableName,
                FilterExpression: roles.map((r, i) => `#OwnerRole = :val${i}`).join(' OR '),
                ExpressionAttributeNames: { '#OwnerRole': 'OwnerRole' },
                ExpressionAttributeValues: roles.reduce((acc, cur, i) => ({ ...acc, [`:val${i}`]: cur }), {}),
            };
            const result = await this.ddbDoc.scan(command);
            return result.Items ? (result.Items as Application[]) : [];
        } catch (error) {
            this.logger.error(`Error finding all user owned applications: ${error}`);
            throw new InternalServerErrorException(error);
        }
    }

    async findAllApplications(): Promise<Application[]> {
        try {
            const command: ScanCommandInput = {
                TableName: this.tableName,
            };
            const result = await this.ddbDoc.scan(command);
            return result.Items ? (result.Items as Application[]) : [];
        } catch (error) {
            this.logger.error(`Error finding all applications: ${error}`);
            throw new InternalServerErrorException(error);
        }
    }

    async createApplication(application: CreateApplicationDto, awsAccounts: ApplicationAwsAccounts) {
        this.logger.debug('[createApplication]');
        try {
            const {
                AwsAccountNameNP,
                AwsAccountNumberNP,
                AwsAccountNamePRD,
                AwsAccountNumberPRD,
                ...applicationDetails
            } = application;

            const putItemInput: PutCommandInput = {
                TableName: this.tableName,
                ConditionExpression: 'attribute_not_exists(PK)',
                Item: {
                    PK: `${application.ShortName}`, // TODO: add APP# prefix to PK
                    LastModified: new Date().toISOString(),
                    ...applicationDetails,
                },
            };

            if (Object.keys(awsAccounts).length !== 0 && putItemInput.Item) {
                putItemInput.Item.AwsAccounts = awsAccounts;
            }

            await this.ddbDoc.put(putItemInput);
            return { message: `Successfully Created Application: ${application.ShortName}` }; // TODO: should return the newly created application
        } catch (error) {
            this.logger.error(`Error creating application: ${error}`);
            throw new InternalServerErrorException(error);
        }
    }

    async updateApplication(application: UpdateApplicationDto, awsAccounts: ApplicationAwsAccounts) {
        this.logger.debug('[updateApplication]');
        try {
            const {
                AwsAccountNameNP,
                AwsAccountNumberNP,
                AwsAccountNamePRD,
                AwsAccountNumberPRD,
                ...applicationDetails
            } = application;

            const ddbItem: { [key: string]: ApplicationAwsAccounts | string | string[] } = {
                LastModified: new Date().toISOString(),
                ...applicationDetails,
            };

            if (Object.keys(awsAccounts).length !== 0) {
                ddbItem.AwsAccounts = awsAccounts;
            }

            const item = Object.entries(ddbItem);

            await this.ddbDoc.update({
                TableName: this.tableName,
                Key: {
                    PK: `${application.ShortName}`,
                },
                ConditionExpression: 'attribute_exists(PK)',
                UpdateExpression: 'SET ' + item.map((_, index) => `#f${index} = :val${index}`),
                ExpressionAttributeNames: Object.fromEntries(item.map((kv, index) => [`#f${index}`, kv[0]])),
                ExpressionAttributeValues: Object.fromEntries(item.map((kv, index) => [`:val${index}`, kv[1]])),
            });
            return {
                message: `Successfully Updated Application Details in Application Table: ${application.ShortName}`, // TODO: should return the updated application
            };
        } catch (error) {
            this.logger.error(`Error Updating Application Details in Application Table: ${error}`);
            throw new InternalServerErrorException(error);
        }
    }

    async deleteApplication(name: string) {
        try {
            await this.ddbDoc.delete({
                TableName: this.tableName,
                Key: {
                    PK: name,
                },
            });
            return { message: `Successfully Deleted Application: ${name}` }; // TODO: don't return anything for a delete function
        } catch (error) {
            this.logger.error(`Error deleting application: ${error}`);
            throw new InternalServerErrorException(error);
        }
    }
}
