import { Test } from '@nestjs/testing';
import { REQUEST } from '@nestjs/core';
import { AuthUser } from '@eai-event-integration-platform/api/auth';
import { SchemaDetails, SchemaSummary, SchemaVersionState } from '@eai-event-integration-platform/interfaces';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Request } from 'express';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';
import { STS } from '@aws-sdk/client-sts';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { EventBridge } from '@aws-sdk/client-eventbridge';
import { Schemas } from '@aws-sdk/client-schemas';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';

import {
    SubscriptionsInfrastructure,
    SubscriptionsRepository,
    SubscriptionsService,
} from '@eai-event-integration-platform/api/subscriptions';
import { AwsService } from '@eai-event-integration-platform/api/aws';
import { SchemasController } from './schemas.controller';
import { SchemasService } from './schemas.service';
import { SchemasInfrastructure } from './schemas.infrastructure';
import { SchemasRepository } from './schemas.repository';
import { CreateSchemaDto, UpdateSchemaDto } from './dto';
import { CloudWatchLogsClient } from '@aws-sdk/client-cloudwatch-logs';

const ddbDocMock = mockClient(DynamoDBDocument);
const schemaMock = mockClient(Schemas);
const ebMock = mockClient(EventBridge);
const stsMock = mockClient(STS);

describe('SchemasController', () => {
    let controller: SchemasController;
    let service: SchemasService;
    let subscriptionsService: SubscriptionsService;
    const mockUser = {
        username: 'test',
        name: 'Surname, Firstname Middlname. (Company name)',
        roles: ['Event.User.JIRA'],
    } as AuthUser;
    const mockRequest = { user: {} } as Request;
    mockRequest.user = mockUser;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            // imports: [ConfigModule],
            providers: [
                {
                    provide: ConfigService,
                    useValue: {
                        getOrThrow: jest.fn((key: string) => ''),
                    },
                },
                EventEmitter2,
                AwsService,
                SchemasService,
                SchemasInfrastructure,
                SchemasRepository,
                SubscriptionsService,
                SubscriptionsInfrastructure,
                SubscriptionsRepository,
                {
                    provide: Schemas,
                    useFactory: async () => new Schemas({ region: 'ap-southeast-2' }),
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
                    provide: STS,
                    useFactory: async () => new STS({ region: 'ap-southeast-2' }),
                },
                {
                    provide: CloudWatchLogsClient,
                    useFactory: async () => new CloudWatchLogsClient({ region: 'ap-southeast-2' }),
                },
                {
                    provide: REQUEST,
                    useValue: {
                        user: { username: 'test@woodside.com.au' },
                    },
                },
            ],
            controllers: [SchemasController],
        }).compile();

        controller = module.get(SchemasController);
        service = await module.resolve(SchemasService);
        // subscriptionsService = await module.resolve(SubscriptionsService);

        ddbDocMock.reset();
        schemaMock.reset();
        ebMock.reset();
        stsMock.reset();
    });

    it('should be defined', () => {
        expect(controller).toBeTruthy();
    });

    it('listSchemas()', async () => {
        // Arrange
        const mockResult: SchemaSummary[] = [
            {
                LastUpdatedBy: 'Andi Samijono:andi.samijono@woodside.com.au',
                EventClassification: 'internal',
                SchemaType: 'JSONSchemaDraft4',
                AppCINumber: '500',
                SchemaSupportGroup: 'test@woodside.com.au',
                Description: 'Testing a Creation of schema. Description',
                AppName: 'JIRA',
                OwnerRole: 'Event.User.JIRA',
                SchemaOwner: 'test@woodside.com.au',
                LastUpdated: '05/09/2022',
                CreatedBy: 'Andi Samijono:andi.samijono@woodside.com.au',
                Domain: 'wel.test',
                SchemaName: 'wel.test@test-test-AS-ddb-5',
                CostCode: '123456',
                VersionCount: 4,
            },
            {
                LastUpdatedBy: 'Rod Pattison:rod.pattison@woodside.com.au',
                EventClassification: 'internal',
                SchemaType: 'JSONSchemaDraft4',
                AppCINumber: '500',
                SchemaArn:
                    'arn:aws:schemas:ap-southeast-2:727026770742:schema/EAI-SchemaRegistry-RP/wel.test.rod@TestEvent',
                SchemaSupportGroup: 'Integration',
                Description: 'A sample JSONSchema Draft 4',
                AppName: 'JIRA',
                OwnerRole: 'Event.User.JIRA',
                SchemaOwner: 'Rod',
                LastUpdated: '9/7/2022',
                CreatedBy: 'Rod Pattison:rod.pattison@woodside.com.au',
                Domain: 'wel.test.rod',
                SchemaName: 'wel.test.rod@TestEvent',
                CostCode: '123456',
                VersionCount: 1,
            },
        ];
        jest.spyOn(service, 'listSchemas').mockImplementation(async () => mockResult);

        // Act
        const response = await controller.listSchemas();

        // Assert
        expect(response).toEqual(mockResult);
    });

    it('downloadCodeBinding()', async () => {
        // Arrange
        const mockResult =
            "/* tslint:disable */\n/**\n* This file was automatically generated by json-schema-to-typescript.\n* DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,\n* and run json-schema-to-typescript to regenerate this file.\n*/export interface HttpExampleComExampleJson {\nversion?: string;\nid?: string;\n'detail-type'?: string;\nsource?: string;\naccount?: string;\ntime?: string;\nregion?: string;\nresources?: unknown[];\ndetail?: {\nMetadata?: {\nGuid?: string;\nTime?: number;\nVersion?: string;\n};\nData?: {\nChecked?: boolean;\nDimensions?: {\nWidth?: number;\nHeight?: number;\n};\nId?: number;\nName?: string;\nPrice?: number;\nTags?: string[];\n};\n};\n}";

        jest.spyOn(service, 'downloadCodeBinding').mockImplementation(async () => mockResult);

        // Act
        const response = await controller.downloadSchemaVersionCodeBinding('wel.test.testrole@testsaprole', '2');

        // Assert
        expect(response.output).toEqual(mockResult);
    });

    describe('create()', () => {
        it('can return the created schema if successful', async () => {
            // Arrange
            const mockResult: SchemaDetails = {
                Description: 'Testing a Creation of schema. Description',
                SchemaName: 'wel.test@test-test-AS-ddb-11',
                CostCode: '123456',
                SchemaOwner: 'test@woodside.com.au',
                SchemaSupportGroup: 'test@woodside.com.au',
                EventClassification: 'internal',
                AppCINumber: '500',
                AppName: 'testApp',
                OwnerRole: 'Event.User.JIRA',
                SchemaArn:
                    'arn:aws:schemas:ap-southeast-2:727026770742:schema/EAI-SchemaRegistry-AS/wel.test@test-test-AS-ddb-11',
                SchemaType: 'JSONSchemaDraft4',
                VersionCount: 1,
                CreatedBy: 'Samijono, Andi <andi.samijono@woodside.com.au>',
                LastUpdatedBy: 'Samijono, Andi <andi.samijono@woodside.com.au>',
                LastUpdated: '2022-09-08T01:36:00.000Z',
                Content:
                    '{"$schema":"http://json-schema.org/draft-04/schema#","type":"object","properties":{"detail-type":{"type":"string"},"resources":{"type":"array","items":{}},"detail":{"type":"object","properties":{"Metadata":{"type":"object","properties":{"Guid":{"type":"string"},"Time":{"type":"string"},"Version":{"type":"string"}}},"Data":{"type":"object","properties":{"data":{"type":"string"}}}}},"id":{"type":"string"},"source":{"type":"string"},"time":{"type":"string"},"region":{"type":"string"},"account":{"type":"string"}},"examples":[{"Metadata":{"Guid":"Guid data","Time":"Time data","Version":"1"},"Data":{"data":"test23"}}]}',
                State: 'drft',
                AWSVersion: '1',
                Version: '1',
                VersionCreatedDate: '2022-09-08T01:36:00.000Z',
            };

            jest.spyOn(service, 'create').mockImplementation(async () => mockResult);
            // Act
            const response = await controller.create(
                {
                    Content:
                        '{"$schema":"http://json-schema.org/draft-04/schema#","type":"object","properties":{"detail-type":{"type":"string"},"resources":{"type":"array","items":{}},"detail":{"type":"object","properties":{"Metadata":{"type":"object","properties":{"Guid":{"type":"string"},"Time":{"type":"string"},"Version":{"type":"string"}}},"Data":{"type":"object","properties":{"data":{"type":"string"}}}}},"id":{"type":"string"},"source":{"type":"string"},"time":{"type":"string"},"region":{"type":"string"},"account":{"type":"string"}},"examples":[{"Metadata":{"Guid":"Guid data","Time":"Time data","Version":"1"},"Data":{"data":"test23"}}]}',
                    Description: 'Testing a Creation of schema. Description',
                    SchemaName: 'wel.test@test-test-AS-ddb-11',
                    CostCode: '123456',
                    SchemaOwner: 'test@woodside.com.au',
                    SchemaSupportGroup: 'test@woodside.com.au',
                    EventClassification: 'internal',
                    AppCINumber: '500',
                    AppName: 'testApp',
                    OwnerRole: 'Event.User.JIRA',
                    Domain: 'wel.test',
                },
                mockRequest,
            );

            // Assert
            expect(response).toEqual(mockResult);
        });

        it('can return an error if exceptions are thrown', async () => {
            // Arrange
            const mockErrorMessage = 'test error message';
            const mockBody: CreateSchemaDto = {
                Content: 'schema string here',
                Description: 'A sample JSONSchema Draft 4 with updated content',
                SchemaName: 'wel.example.test@TestEvent1',
                CostCode: 'abc',
                SchemaOwner: 'abc',
                SchemaSupportGroup: 'abc',
                EventClassification: 'confidential',
                AppCINumber: 'abc',
                AppName: 'testApp',
                OwnerRole: 'Event.User.Digital',
                Domain: 'wel.example.test',
            };
            jest.spyOn(service, 'create').mockImplementation(async () => {
                throw new Error(mockErrorMessage);
            });

            // Act
            const pResponse = controller.create(mockBody, mockRequest);

            // Assert
            expect(pResponse).rejects.toThrowError(mockErrorMessage);
        });
    });

    describe('update()', () => {
        it("will return an error if user doesn't have the owner role", async () => {
            // Arrange
            const mockName = 'wel.test@test-test-AS-ddb-5';
            const mockSchema = {
                OwnerRole: 'Event.User.Irrelevant',
            };
            const mockBody: UpdateSchemaDto = {
                Content:
                    '{"$schema":"http://json-schema.org/draft-04/schema#","type":"object","properties":{"detail-type":{"type":"string"},"resources":{"type":"array","items":{}},"detail":{"type":"object","properties":{"Metadata":{"type":"object","properties":{"Guid":{"type":"string"},"Time":{"type":"string"},"Version":{"type":"string"}}},"Data":{"type":"object","properties":{"data":{"type":"string"}}}}},"id":{"type":"string"},"source":{"type":"string"},"time":{"type":"string"},"region":{"type":"string"},"account":{"type":"string"}},"examples":[{"Metadata":{"Guid":"Guid data","Time":"Time data","Version":"1"},"Data":{"data":"test23"}}]}',
                Description: 'Testing a Creation of schema. Description',
                SchemaName: 'wel.test@test-test-AS-ddb-5',
                CostCode: '123456',
                SchemaOwner: 'test@woodside.com.au',
                SchemaSupportGroup: 'test@woodside.com.au',
                EventClassification: 'internal',
                AppCINumber: '500',
                AppName: 'testApp',
                OwnerRole: 'Event.User.JIRA',
            };

            jest.spyOn(service, 'getSchema').mockImplementation(async () => mockSchema);

            // Act
            const pResponse = controller.update(mockName, mockBody, mockRequest);

            // Assert
            await expect(pResponse).rejects.toThrowError(
                'Forbidden, user does not have the necessary role to perform create, read or delete operations',
            );
        });
        it("will return an error if schema names don't match", async () => {
            // Arrange
            const mockName = 'wel.example.test@WrongEventName';
            const mockBody: UpdateSchemaDto = {
                Content:
                    '{"$schema":"http://json-schema.org/draft-04/schema#","type":"object","properties":{"detail-type":{"type":"string"},"resources":{"type":"array","items":{}},"detail":{"type":"object","properties":{"Metadata":{"type":"object","properties":{"Guid":{"type":"string"},"Time":{"type":"string"},"Version":{"type":"string"}}},"Data":{"type":"object","properties":{"data":{"type":"string"}}}}},"id":{"type":"string"},"source":{"type":"string"},"time":{"type":"string"},"region":{"type":"string"},"account":{"type":"string"}},"examples":[{"Metadata":{"Guid":"Guid data","Time":"Time data","Version":"1"},"Data":{"data":"test23"}}]}',
                Description: 'Testing a Creation of schema. Description',
                SchemaName: 'wel.test@test-test-AS-ddb-5',
                CostCode: '123456',
                SchemaOwner: 'test@woodside.com.au',
                SchemaSupportGroup: 'test@woodside.com.au',
                EventClassification: 'internal',
                AppCINumber: '500',
                AppName: 'testApp',
                OwnerRole: 'Event.User.JIRA',
            };

            // Act
            const pResponse = controller.update(mockName, mockBody, mockRequest);

            // Assert
            await expect(pResponse).rejects.toThrowError('Mismatching SchemaName in body and URL query params');
        });

        it('can return an error if exceptions are thrown in the service', async () => {
            // Arrange
            const mockName = 'wel.test@test-test-AS-ddb-5';
            const mockErrorMessage = 'test error message';
            const mockBody: UpdateSchemaDto = {
                Content:
                    '{"$schema":"http://json-schema.org/draft-04/schema#","type":"object","properties":{"detail-type":{"type":"string"},"resources":{"type":"array","items":{}},"detail":{"type":"object","properties":{"Metadata":{"type":"object","properties":{"Guid":{"type":"string"},"Time":{"type":"string"},"Version":{"type":"string"}}},"Data":{"type":"object","properties":{"data":{"type":"string"}}}}},"id":{"type":"string"},"source":{"type":"string"},"time":{"type":"string"},"region":{"type":"string"},"account":{"type":"string"}},"examples":[{"Metadata":{"Guid":"Guid data","Time":"Time data","Version":"1"},"Data":{"data":"test23"}}]}',
                Description: 'Testing a Creation of schema. Description',
                SchemaName: 'wel.test@test-test-AS-ddb-5',
                CostCode: '123456',
                SchemaOwner: 'test@woodside.com.au',
                SchemaSupportGroup: 'test@woodside.com.au',
                EventClassification: 'internal',
                AppCINumber: '500',
                AppName: 'testApp',
                OwnerRole: 'Event.User.JIRA',
            };
            const mockSchema = {
                OwnerRole: 'Event.User.JIRA',
            };
            jest.spyOn(service, 'getSchema').mockImplementation(async () => mockSchema);
            jest.spyOn(service, 'update').mockImplementation(async () => {
                throw new Error(mockErrorMessage);
            });

            // Act
            try {
                await controller.update(mockName, mockBody, mockRequest);
            } catch (error: any) {
                // Assert
                expect(error.message).toMatch(mockErrorMessage);
            }
        });

        it('can return the updated schema with if successful', async () => {
            // Arrange
            const mockName = 'wel.test@test-test-AS-ddb-5';
            const mockResult: SchemaDetails = {
                LastUpdatedBy: 'Andi Samijono:andi.samijono@woodside.com.au',
                EventClassification: 'internal',
                SchemaType: 'JSONSchemaDraft4',
                AppCINumber: '500',
                SchemaArn:
                    'arn:aws:schemas:ap-southeast-2:727026770742:schema/EAI-SchemaRegistry-AS/wel.test@test-test-AS-ddb-5',
                SchemaSupportGroup: 'test@woodside.com.au',
                Description: 'Testing a Creation of schema. Description',
                AppName: 'JIRA',
                OwnerRole: 'Event.User.JIRA',
                SchemaOwner: 'test@woodside.com.au',
                LastUpdated: '07/09/2022',
                CreatedBy: 'Andi Samijono:andi.samijono@woodside.com.au',
                Domain: 'wel.test',
                SchemaName: 'wel.test@test-test-AS-ddb-5',
                CostCode: '123456',
                VersionCount: 1,
                AvailableVersions: {
                    '1': SchemaVersionState.DRFT,
                },
                AWSVersion: '2',
                Content:
                    '{"$schema":"http://json-schema.org/draft-04/schema#","type":"object","properties":{"detail-type":{"type":"string"},"resources":{"type":"array","items":{"test":"test"}},"detail":{"type":"object","properties":{"Metadata":{"type":"object","properties":{"Guid":{"type":"string"},"Time":{"type":"string"},"Version":{"type":"string"}}},"Data":{"type":"object","properties":{"data":{"type":"string"}}}}},"id":{"type":"string"},"source":{"type":"string"},"time":{"type":"string"},"region":{"type":"string"},"account":{"type":"string"}},"examples":[{"Metadata":{"Guid":"Guid data","Time":"Time data","Version":"1"},"Data":{"data3":"test11"}}]}',
                Version: '1',
                State: 'drft',
                VersionCreatedDate: '07/09/2022',
                Subscriptions: [],
            };
            const mockSchema = {
                OwnerRole: 'Event.User.JIRA',
            };
            jest.spyOn(service, 'getSchema').mockImplementation(async () => mockSchema);
            jest.spyOn(service, 'update').mockImplementation(async () => mockResult);

            const mockBody: UpdateSchemaDto = {
                EventClassification: 'internal',
                Content:
                    '{"$schema":"http://json-schema.org/draft-04/schema#","type":"object","properties":{"detail-type":{"type":"string"},"resources":{"type":"array","items":{"test":"test"}},"detail":{"type":"object","properties":{"Metadata":{"type":"object","properties":{"Guid":{"type":"string"},"Time":{"type":"string"},"Version":{"type":"string"}}},"Data":{"type":"object","properties":{"data":{"type":"string"}}}}},"id":{"type":"string"},"source":{"type":"string"},"time":{"type":"string"},"region":{"type":"string"},"account":{"type":"string"}},"examples":[{"Metadata":{"Guid":"Guid data","Time":"Time data","Version":"1"},"Data":{"data3":"test11"}}]}',
                SchemaSupportGroup: 'test@woodside.com.au',
                Description: 'Testing a Creation of schema. Description. I CHANGED THIS 4',
                OwnerRole: 'Event.User.JIRA',
                SchemaOwner: 'test@woodside.com.au',
                SchemaName: 'wel.test@test-test-AS-ddb-5',
                AppCINumber: '500',
                AppName: 'testApp',
                CostCode: '123456',
            };

            // Act
            const response = await controller.update(mockName, mockBody, mockRequest);

            // Assert
            expect(response).toEqual(mockResult);
        });
    });

    describe('getRecentEvents', () => {
        it('will set hours to integer passed by string parameter', async () => {
            const request = structuredClone(mockRequest);
            request.params = { name: 'wel.test@test-test-AS-ddb-5' };
            request.query = { hours: '12' };
            jest.spyOn(service, 'getRecentEvents').mockImplementation(async (_eventSource, _eventName, hours) => [
                hours,
            ]);
            const response = await controller.getRecentEvents(request);
            expect(response).toEqual([12]);
        });

        it('will set hours to 1 if not passed the parameter', async () => {
            const request = structuredClone(mockRequest);
            request.params = { name: 'wel.test@test-test-AS-ddb-5' };
            jest.spyOn(service, 'getRecentEvents').mockImplementation(async (_eventSource, _eventName, hours) => [
                hours,
            ]);
            const response = await controller.getRecentEvents(request);
            expect(response).toEqual([1]);
        });
    });

    describe('delete()', () => {
        it("will return an error if user doesn't have the owner role", async () => {
            // Arrange
            const mockName = 'wel.example.test@WrongEventName';
            const mockSchema = {
                OwnerRole: 'Event.User.Irrelevant',
            };

            jest.spyOn(service, 'getSchema').mockImplementation(async () => mockSchema);

            // Act
            const pResponse = controller.remove(mockName, mockRequest);

            // Assert
            await expect(pResponse).rejects.toThrowError(
                'Forbidden, user does not have the necessary role to perform create, read or delete operations',
            );
        });
    });
});
