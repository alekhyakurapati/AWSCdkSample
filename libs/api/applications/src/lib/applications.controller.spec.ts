import { CloudWatchLogsClient } from '@aws-sdk/client-cloudwatch-logs';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { EventBridge } from '@aws-sdk/client-eventbridge';
import { Schemas } from '@aws-sdk/client-schemas';
import { STS } from '@aws-sdk/client-sts';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { AuthUser } from '@eai-event-integration-platform/api/auth';
import { AwsService } from '@eai-event-integration-platform/api/aws';
import { SchemasInfrastructure, SchemasRepository, SchemasService } from '@eai-event-integration-platform/api/schemas';
import {
    SubscriptionsInfrastructure,
    SubscriptionsRepository,
    SubscriptionsService,
} from '@eai-event-integration-platform/api/subscriptions';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import { mockClient } from 'aws-sdk-client-mock';
import { Request } from 'express';

import { ApplicationsController } from './applications.controller';
import { ApplicationsRepository } from './applications.repository';
import { ApplicationsService } from './applications.service';
import { UpdateApplicationDto } from './dto';

describe('ApplicationsController', () => {
    let controller: ApplicationsController;
    let service: ApplicationsService;
    const mockUser = { username: 'test', name: 'Surname, Firstname Middlname. (Company name)' } as AuthUser;
    const mockRequest = { user: {} } as Request;
    mockRequest.user = mockUser;
    const cloudWatchMock = mockClient(CloudWatchLogsClient);

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                EventEmitter2,
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
            controllers: [ApplicationsController],
        }).compile();

        controller = module.get(ApplicationsController);
        service = module.get(ApplicationsService);
        cloudWatchMock.reset();
    });

    describe('listApplications', () => {
        it('can return applications if successful', async () => {
            //Output
            const mockResult = [
                {
                    ShortName: 'JIRA',
                    LastUpdated: '16/8/2022',
                    ContactEmail: 'test@woodside.com.au',
                    CINumber: 'test',
                    PK: 'JIRA',
                    CostCode: 'test',
                    Name: 'Atlassian JIRA',
                    Owner: 'test',
                    OwnerRole: 'Event.User.JIRA',
                    SupportEmail: ['support@woodside.com.au'],
                },
                {
                    ShortName: 'SAP',
                    LastUpdated: '16/8/2022',
                    ContactEmail: 'test@woodside.com.au',
                    CINumber: 'test',
                    PK: 'SAP',
                    CostCode: 'test',
                    Name: 'SAP Enterprise Solutions',
                    Owner: 'test',
                    OwnerRole: 'Event.User.SAP',
                    SupportEmail: ['support@woodside.com.au'],
                },
            ];

            jest.spyOn(service, 'listApplications').mockImplementation(async () => mockResult);
            // Act
            const response = await controller.listApplications();
            // Assert
            expect(response).toEqual(mockResult);
        });

        it('can return an error if exceptions are thrown', async () => {
            //Output
            const mockErrorMessage = 'test error message';
            jest.spyOn(service, 'listApplications').mockImplementation(async () => {
                throw new Error(mockErrorMessage);
            });

            // Act
            try {
                await controller.listApplications();
            } catch (error: any) {
                // Assert
                expect(error.message).toMatch(mockErrorMessage);
            }
        });
    });

    describe('getApplication', () => {
        it('can return an application detail if successful', async () => {
            //Output
            const mockResult = {
                ShortName: 'SAP',
                LastUpdated: '16/8/2022',
                ContactEmail: 'test@woodside.com.au',
                CINumber: 'test',
                PK: 'SAP',
                CostCode: 'test',
                Name: 'SAP Enterprise Solutions',
                Owner: 'test',
                OwnerRole: 'Event.User.SAP',
                SupportEmail: ['support@woodside.com.au'],
            };

            jest.spyOn(service, 'getApplication').mockImplementation(async () => mockResult);
            // Act
            const response = await controller.getApplication('SAP');
            // Assert
            expect(response).toEqual(mockResult);
        });

        it('can return an error if exceptions are thrown', async () => {
            //Output
            const mockErrorMessage = 'test error message';
            jest.spyOn(service, 'getApplication').mockImplementation(async () => {
                throw new NotFoundException(mockErrorMessage);
            });

            // Act
            try {
                await controller.getApplication('SAP');
            } catch (error: any) {
                // Assert
                expect(error.message).toMatch(mockErrorMessage);
            }
        });
    });

    describe('updateApplication', () => {
        it('should throw an error when url query params does not match app short name in payload', async () => {
            const appShortName = 'incorrectShortName';
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
            try {
                await controller.updateApplication(appShortName, updateApplicationDto, mockRequest);
            } catch (error: any) {
                expect(error).toBeInstanceOf(BadRequestException);
            }
        });
    });
});
