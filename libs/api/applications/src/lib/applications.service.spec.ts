import { CloudWatchLogsClient } from '@aws-sdk/client-cloudwatch-logs';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { EventBridge } from '@aws-sdk/client-eventbridge';
import { Schemas } from '@aws-sdk/client-schemas';
import { STS } from '@aws-sdk/client-sts';
import {
    DynamoDBDocument,
    GetCommand,
    GetCommandOutput,
    PutCommand,
    ScanCommand,
    UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { AuthUser } from '@eai-event-integration-platform/api/auth';
import { AwsService } from '@eai-event-integration-platform/api/aws';
import { SchemasInfrastructure, SchemasRepository, SchemasService } from '@eai-event-integration-platform/api/schemas';
import {
    SubscriptionsInfrastructure,
    SubscriptionsRepository,
    SubscriptionsService,
} from '@eai-event-integration-platform/api/subscriptions';
import { ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';
import { Request } from 'express';
import { ApplicationsRepository } from './applications.repository';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto, UpdateApplicationDto } from './dto';
const cloudWatchMock = mockClient(CloudWatchLogsClient);
const ddbMock = mockClient(DynamoDBDocument);
const ebMock = mockClient(EventBridge);
const schemasMock = mockClient(Schemas);
const stsMock = mockClient(STS);

describe('ApplicationsService', () => {
    let service: ApplicationsService;

    const mockUser = {
        username: 'test.user@woodside.com.au',
        name: 'User, Test',
        roles: ['Event.Publisher.JIRA'],
    } as AuthUser;
    const mockRequest = { user: {} } as Request;
    mockRequest.user = mockUser;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                ApplicationsService,
                ApplicationsRepository,
                SchemasService,
                SchemasRepository,
                SchemasInfrastructure,
                SubscriptionsService,
                SubscriptionsRepository,
                SubscriptionsInfrastructure,
                AwsService,
                {
                    provide: CloudWatchLogsClient,
                    useFactory: async () => new CloudWatchLogsClient({ region: 'ap-southeast-2' }),
                },
                {
                    provide: DynamoDBDocument,
                    useFactory: async () => DynamoDBDocument.from(new DynamoDB({ region: 'ap-southeast-2' })),
                },
                {
                    provide: EventBridge,
                    useFactory: async () => new EventBridge({ region: 'ap-southeast-2' }),
                },
                {
                    provide: Schemas,
                    useFactory: async () => new Schemas({ region: 'ap-southeast-2' }),
                },
                {
                    provide: STS,
                    useFactory: async () => new STS({ region: 'ap-southeast-2' }),
                },
                {
                    provide: ConfigService,
                    useValue: {
                        getOrThrow: jest.fn((key: string) => {
                            return '';
                        }),
                    },
                },
                { provide: REQUEST, useValue: mockRequest },
            ],
        }).compile();

        service = module.get(ApplicationsService);

        cloudWatchMock.reset();
        ddbMock.reset();
        ebMock.reset();
        schemasMock.reset();
        stsMock.reset();
    });
    describe('listApplications()', () => {
        it('should return all applications if no filter provided', async () => {
            // Arrange
            ddbMock.on(ScanCommand).resolves({
                $metadata: {},
                ConsumedCapacity: undefined,
                Count: 2,
                Items: [
                    {
                        ShortName: 'JIRA',
                        LastUpdated: '16/8/2022',
                        ContactEmail: 'test@woodside.com.au',
                        CINumber: 'test',
                        PK: 'JIRA',
                        CostCode: 'test',
                        Name: 'Atlassian JIRA',
                        OwnerRole: 'Event.User.JIRA',
                    },
                    {
                        ShortName: 'SAP',
                        LastUpdated: '16/8/2022',
                        ContactEmail: 'test@woodside.com.au',
                        CINumber: 'test',
                        PK: 'SAP',
                        CostCode: 'test',
                        Name: 'SAP Enterprise Solutions',
                        OwnerRole: 'Event.User.SAP',
                    },
                ],
                LastEvaluatedKey: undefined,
                ScannedCount: 2,
            });

            // Act
            const result = await service.listApplications();

            // Assert
            const expectedResult = [
                {
                    ShortName: 'JIRA',
                    LastUpdated: '16/8/2022',
                    ContactEmail: 'test@woodside.com.au',
                    CINumber: 'test',
                    PK: 'JIRA',
                    CostCode: 'test',
                    Name: 'Atlassian JIRA',
                    OwnerRole: 'Event.User.JIRA',
                },
                {
                    ShortName: 'SAP',
                    LastUpdated: '16/8/2022',
                    ContactEmail: 'test@woodside.com.au',
                    CINumber: 'test',
                    PK: 'SAP',
                    CostCode: 'test',
                    Name: 'SAP Enterprise Solutions',
                    OwnerRole: 'Event.User.SAP',
                },
            ];
            expect(result).toEqual(expectedResult);
        });
        it('should return user-owned applications if a filter is provided', async () => {
            // Arrange
            ddbMock.on(ScanCommand).resolves({
                $metadata: { httpStatusCode: 200 },
                Items: [
                    {
                        ShortName: 'JIRA',
                        LastUpdated: '16/8/2022',
                        ContactEmail: 'test@woodside.com.au',
                        CINumber: 'test',
                        PK: 'JIRA',
                        CostCode: 'test',
                        Name: 'Atlassian JIRA',
                        OwnerRole: 'Event.User.JIRA',
                    },
                ],
            });

            // Act
            const result = await service.listApplications(true);

            // Assert
            const expectedResult = [
                {
                    ShortName: 'JIRA',
                    LastUpdated: '16/8/2022',
                    ContactEmail: 'test@woodside.com.au',
                    CINumber: 'test',
                    PK: 'JIRA',
                    CostCode: 'test',
                    Name: 'Atlassian JIRA',
                    OwnerRole: 'Event.User.JIRA',
                },
            ];
            expect(result).toEqual(expectedResult);
        });
    });

    describe('getApplication()', () => {
        it('should return a single application detail if successful ', async () => {
            // Output
            const mockResult: GetCommandOutput = {
                $metadata: {},
                ConsumedCapacity: undefined,
                Item: {
                    ShortName: 'SAP',
                    LastUpdated: '16/8/2022',
                    ContactEmail: 'test@woodside.com.au',
                    CINumber: 'test',
                    PK: 'SAP',
                    CostCode: 'test',
                    Name: 'SAP Enterprise Solutions',
                    OwnerRole: 'Event.User.SAP',
                    SupportEmail: ['test@woodside.com.au'],
                },
            };

            ddbMock.on(GetCommand).resolves(mockResult);

            //Act
            const result = await service.getApplication('SAP');

            expect(result).toEqual(mockResult.Item!);
        });
    });

    describe('createApplication()', () => {
        it('should create an application in dynamodb if successful', async () => {
            const createApplicationDto: CreateApplicationDto = {
                CINumber: 'CI00030321',
                ContactEmail: 'andi.samijono@woodside.com.au',
                CostCode: '-',
                Name: 'JIRA Data Center',
                Owner: 'Noelene Clarke',
                OwnerRole: 'Event.User.JIRA',
                ShortName: 'JIRA',
                AssignmentGroup: 'Dig-Jira/Confluence Support',
                SupportEmail: ['support@email.com'],
                AwsAccountNameNP: 'wpl-wrk-int-np',
                AwsAccountNumberNP: '123456789',
                AwsAccountNamePRD: 'wpl-wrk-int-prd',
                AwsAccountNumberPRD: '987654321',
            };

            await service.createApplication(createApplicationDto);
            expect(ddbMock).toHaveReceivedCommandTimes(PutCommand, 1);
        });
    });

    describe('updateApplication()', () => {
        it('should update an application', async () => {
            const updateApplicationDto: UpdateApplicationDto = {
                CINumber: 'CI00030321',
                ContactEmail: 'andi.samijono@woodside.com.au',
                CostCode: '-',
                Name: 'JIRA Data Center',
                Owner: 'Noelene Clarke',
                OwnerRole: 'Event.User.JIRA',
                ShortName: 'JIRA',
                AssignmentGroup: 'Dig-Jira/Confluence Support',
                SupportEmail: ['support@email.com'],
                AwsAccountNameNP: 'wpl-wrk-int-np',
                AwsAccountNumberNP: '123456789',
                AwsAccountNamePRD: 'wpl-wrk-int-prd',
                AwsAccountNumberPRD: '987654321',
            };
            ddbMock.on(UpdateCommand).resolves({ $metadata: { httpStatusCode: 200 } });
            await service.updateApplication(updateApplicationDto);
            expect(ddbMock).toHaveReceivedCommand(UpdateCommand);
        });
    });
});
