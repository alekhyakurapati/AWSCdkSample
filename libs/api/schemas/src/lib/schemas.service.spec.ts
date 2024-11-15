import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { REQUEST } from '@nestjs/core';
import {
    CreateSchemaCommand,
    CreateSchemaCommandOutput,
    DeleteSchemaCommand,
    Schemas,
    UpdateSchemaCommand,
    UpdateSchemaCommandOutput,
} from '@aws-sdk/client-schemas';
import { ScanCommand, QueryCommand, PutCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';
import { BrokerTypes, SchemaVersionState, SubscriptionState } from '@eai-event-integration-platform/interfaces';
import { AwsService } from '@eai-event-integration-platform/api/aws';
import {
    SubscriptionsInfrastructure,
    SubscriptionsRepository,
    SubscriptionsService,
} from '@eai-event-integration-platform/api/subscriptions';
import { AuthUser } from '@eai-event-integration-platform/api/auth';
import { generateChangedBy } from '@eai-event-integration-platform/utils';
import { CreateSchemaDto, UpdateSchemaDto } from './dto';
import { SchemasService } from './schemas.service';
import { SchemasRepository } from './schemas.repository';
import { SchemasInfrastructure } from './schemas.infrastructure';
import { Request } from 'express';
import { STS } from '@aws-sdk/client-sts';
import { EventBridge } from '@aws-sdk/client-eventbridge';
import {
    CloudWatchLogsClient,
    GetQueryResultsCommand,
    StartQueryCommand,
    StopQueryCommand,
} from '@aws-sdk/client-cloudwatch-logs';

const cloudWatchMock = mockClient(CloudWatchLogsClient);
const ddbDocMock = mockClient(DynamoDBDocument);
const schemaMock = mockClient(Schemas);
const ebMock = mockClient(EventBridge);
const stsMock = mockClient(STS);

const mockSchemaTableData = [
    {
        PK: 'SCH#wel.test@test-test-TEST-ddb-5',
        SK: 'SCH#wel.test@test-test-TEST-ddb-5',
        EventClassification: 'internal',
        SchemaSupportGroup: 'test@woodside.com.au',
        Description: 'Testing a Creation of schema. Description.  3',
        Type: 'Schema',
        AppName: 'JIRA',
        OwnerRole: 'Event.User.JIRA',
        SchemaOwner: 'test@woodside.com.au',
        CreatedBy: 'firstName lastName:firstName.lastName@woodside.com.au',
        Domain: 'wel.test',
        SchemaName: 'wel.test@test-test-TEST-ddb-5',
        AppCINumber: '500',
        CostCode: '123456',
    },
    {
        PK: 'SCH#wel.test@test-test-TEST-ddb-5',
        SK: 'VER#1',
        AWSVersion: '1',
        Content: '{}',
        Version: '1',
        State: SchemaVersionState.DEPR,
        Type: 'Version',
    },
    {
        PK: 'SCH#wel.test@test-test-TEST-ddb-5',
        SK: 'VER#2',
        AWSVersion: '2',
        Content: '{}',
        Version: '2',
        State: SchemaVersionState.PUBL,
        Type: 'Version',
    },
    {
        EventClassification: 'internal',
        SchemaSupportGroup: 'test@woodside.com.au',
        Description: 'Testing a Creation of schema. Description',
        Type: 'Schema',
        AppName: 'JIRA',
        OwnerRole: 'Event.User.JIRA',
        SchemaOwner: 'test@woodside.com.au',
        CreatedBy: 'firstName lastName:firstName.lastName@woodside.com.au',
        Domain: 'wel.test',
        SchemaName: 'wel.test@test-test-TEST-ddb-6',
        AppCINumber: '500',
        CostCode: '123456',
    },
    {
        PK: 'SCH#wel.test@test-test-TEST-ddb-6',
        SK: 'VER#1',
        AWSVersion: '1',
        Content: '{}',
        Version: '1',
        State: SchemaVersionState.DRFT,
        Type: 'Version',
    },
    {
        EventClassification: 'internal',
        SchemaSupportGroup: 'test@woodside.com.au',
        Description: 'Testing a Creation of schema. Description',
        Type: 'Schema',
        AppName: 'JIRA',
        OwnerRole: 'Event.User.JIRA',
        SchemaOwner: 'test@woodside.com.au',
        CreatedBy: 'firstName lastName:firstName.lastName@woodside.com.au',
        Domain: 'wel.test',
        SchemaName: 'wel.test@test-test-TEST-ddb-7',
        AppCINumber: '500',
        CostCode: '123456',
    },
    {
        PK: 'SCH#wel.test@test-test-TEST-ddb-7',
        SK: 'VER#1',
        AWSVersion: '1',
        Content: '{}',
        Version: '1',
        State: SchemaVersionState.DRFT,
        Type: 'Version',
    },
];
describe('SchemasService', () => {
    let schemaService: SchemasService;
    let subscriptionsService: SubscriptionsService;

    const mockUser = {
        username: 'test.user@woodside.com.au',
        name: 'User, Test',
        roles: ['Event.User.JIRA'],
    } as AuthUser;
    const mockRequest = { user: {} } as Request;
    mockRequest.user = mockUser;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                SchemasService,
                AwsService,
                SchemasInfrastructure,
                SchemasRepository,
                SubscriptionsService,
                SubscriptionsInfrastructure,
                SubscriptionsRepository,
                {
                    provide: ConfigService,
                    useValue: {
                        getOrThrow: jest.fn((key: string) => ''),
                    },
                },
                {
                    provide: CloudWatchLogsClient,
                    useFactory: async () => new CloudWatchLogsClient({ region: 'ap-southeast-2' }),
                },
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
                    provide: REQUEST,
                    useValue: mockRequest,
                },
            ],
        }).compile();

        schemaService = await module.resolve(SchemasService);
        subscriptionsService = await module.resolve(SubscriptionsService);
        ddbDocMock.reset();
        schemaMock.reset();
        ebMock.reset();
        stsMock.reset();
        cloudWatchMock.reset();
    });

    it('should be defined', () => {
        expect(schemaService).toBeTruthy();
    });

    describe('listSchemas', () => {
        it('listSchemas() should return a list of schemas', async () => {
            // Arrange
            const mockResult = [
                {
                    EventClassification: 'internal',
                    SchemaSupportGroup: 'test@woodside.com.au',
                    Description: 'Testing a Creation of schema. Description.  3',
                    AppName: 'JIRA',
                    OwnerRole: 'Event.User.JIRA',
                    SchemaOwner: 'test@woodside.com.au',
                    CreatedBy: 'firstName lastName:firstName.lastName@woodside.com.au',
                    Domain: 'wel.test',
                    SchemaName: 'wel.test@test-test-TEST-ddb-5',
                    AppCINumber: '500',
                    CostCode: '123456',
                },
                {
                    EventClassification: 'internal',
                    SchemaSupportGroup: 'test@woodside.com.au',
                    Description: 'Testing a Creation of schema. Description',
                    AppName: 'JIRA',
                    OwnerRole: 'Event.User.JIRA',
                    SchemaOwner: 'test@woodside.com.au',
                    CreatedBy: 'firstName lastName:firstName.lastName@woodside.com.au',
                    Domain: 'wel.test',
                    SchemaName: 'wel.test@test-test-TEST-ddb-6',
                    AppCINumber: '500',
                    CostCode: '123456',
                },
                {
                    EventClassification: 'internal',
                    SchemaSupportGroup: 'test@woodside.com.au',
                    Description: 'Testing a Creation of schema. Description',
                    AppName: 'JIRA',
                    OwnerRole: 'Event.User.JIRA',
                    SchemaOwner: 'test@woodside.com.au',
                    CreatedBy: 'firstName lastName:firstName.lastName@woodside.com.au',
                    Domain: 'wel.test',
                    SchemaName: 'wel.test@test-test-TEST-ddb-7',
                    AppCINumber: '500',
                    CostCode: '123456',
                },
            ];
            ddbDocMock.on(ScanCommand).resolves({
                $metadata: { httpStatusCode: 200 },
                Items: mockSchemaTableData,
            });

            // Act
            const result = await schemaService.listSchemas();

            // Assert
            const expectedResult = mockSchemaTableData
                .filter((d) => d.Type === 'Schema')
                .map(({ PK, SK, Type, ...rest }) => rest);
            expect(result).toEqual(expectedResult);
        });
    });

    describe('getSchema', () => {
        it('should return a single schema with the latest version if available', async () => {
            // Arrange
            ddbDocMock.on(QueryCommand).resolves({
                $metadata: { httpStatusCode: 200 },
                Items: [
                    {
                        EventClassification: 'internal',
                        SchemaSupportGroup: 'test@woodside.com.au',
                        Description: 'Testing a Creation of schema. Description',
                        Type: 'Schema',
                        AppName: 'JIRA',
                        OwnerRole: 'Event.User.JIRA',
                        SchemaOwner: 'test@woodside.com.au',
                        SK: '#SCH#wel.test@test-test-TEST-ddb-5',
                        CreatedBy: 'firstName lastName:firstName.lastName@woodside.com.au',
                        Domain: 'wel.test',
                        SchemaName: 'wel.test@test-test-TEST-ddb-5',
                        AppCINumber: '500',
                        PK: 'SCH#wel.test@test-test-TEST-ddb-5',
                        CostCode: '123456',
                        SchemaType: 'JSONSchemaDraft4',
                        Service: 'test-test-TEST-ddb-5',
                        VersionCount: 2,
                        AvailableVersions: {
                            '1': 'publ',
                            '2': 'drft',
                        },
                        VersionCreatedDate: '07/09/2022',
                        SchemaArn:
                            'arn:aws:schemas:ap-southeast-2:727026770742:schema/EAI-SchemaRegistry-TEST/wel.test@test-test-TEST-ddb-5',
                    },
                    {
                        LastUpdated: '07/09/2022',
                        LastUpdatedBy: 'firstName lastName:firstName.lastName@woodside.com.au',
                        Version: '1',
                        State: SchemaVersionState.PUBL,
                        Content:
                            '{"$schema":"http://json-schema.org/draft-04/schema#","type":"object","properties":{"detail-type":{"type":"string"},"resources":{"type":"array","items":{"test":"test"}},"detail":{"type":"object","properties":{"Metadata":{"type":"object","properties":{"Guid":{"type":"string"},"Time":{"type":"string"},"Version":{"type":"string"}}},"Data":{"type":"object","properties":{"data":{"type":"string"}}}}},"id":{"type":"string"},"source":{"type":"string"},"time":{"type":"string"},"region":{"type":"string"},"account":{"type":"string"}},"examples":[{"Metadata":{"Guid":"Guid data","Time":"Time data","Version":"1"},"Data":{"data3":"test11"}}]}',
                        SK: 'VER#1',
                        AWSVersion: '1',
                        PK: 'SCH#wel.test@test-test-TEST-ddb-5',
                        Type: 'Version',
                    },
                    {
                        LastUpdated: '07/09/2022',
                        LastUpdatedBy: 'firstName lastName:firstName.lastName@woodside.com.au',
                        Version: '2',
                        State: SchemaVersionState.DRFT,
                        Content:
                            '{"$schema":"http://json-schema.org/draft-04/schema#","type":"object","properties":{"detail-type":{"type":"string"},"resources":{"type":"array","items":{"test":"test"}},"detail":{"type":"object","properties":{"Metadata":{"type":"object","properties":{"Guid":{"type":"string"},"Time":{"type":"string"},"Version":{"type":"string"}}},"Data":{"type":"object","properties":{"data":{"type":"string"}}}}},"id":{"type":"string"},"source":{"type":"string"},"time":{"type":"string"},"region":{"type":"string"},"account":{"type":"string"}},"examples":[{"Metadata":{"Guid":"Guid data","Time":"Time data","Version":"1"},"Data":{"data3":"test11"}}]}',
                        SK: 'VER#2',
                        AWSVersion: '2',
                        PK: 'SCH#wel.test@test-test-TEST-ddb-5',
                        Type: 'Version',
                    },
                ],
            });

            // Act
            const result = await schemaService.getSchema('wel.test@test-test-TEST-ddb-5');

            // Assert
            expect(result).toEqual({
                LastUpdatedBy: 'firstName lastName:firstName.lastName@woodside.com.au',
                EventClassification: 'internal',
                SchemaType: 'JSONSchemaDraft4',
                AppCINumber: '500',
                SchemaArn:
                    'arn:aws:schemas:ap-southeast-2:727026770742:schema/EAI-SchemaRegistry-TEST/wel.test@test-test-TEST-ddb-5',
                Service: 'test-test-TEST-ddb-5',
                SchemaSupportGroup: 'test@woodside.com.au',
                Description: 'Testing a Creation of schema. Description',
                AppName: 'JIRA',
                OwnerRole: 'Event.User.JIRA',
                SchemaOwner: 'test@woodside.com.au',
                LastUpdated: '07/09/2022',
                CreatedBy: 'firstName lastName:firstName.lastName@woodside.com.au',
                Domain: 'wel.test',
                SchemaName: 'wel.test@test-test-TEST-ddb-5',
                CostCode: '123456',
                VersionCount: 2,
                AvailableVersions: {
                    '1': 'publ',
                    '2': 'drft',
                },
                AWSVersion: '2',
                Content:
                    '{"$schema":"http://json-schema.org/draft-04/schema#","type":"object","properties":{"detail-type":{"type":"string"},"resources":{"type":"array","items":{"test":"test"}},"detail":{"type":"object","properties":{"Metadata":{"type":"object","properties":{"Guid":{"type":"string"},"Time":{"type":"string"},"Version":{"type":"string"}}},"Data":{"type":"object","properties":{"data":{"type":"string"}}}}},"id":{"type":"string"},"source":{"type":"string"},"time":{"type":"string"},"region":{"type":"string"},"account":{"type":"string"}},"examples":[{"Metadata":{"Guid":"Guid data","Time":"Time data","Version":"1"},"Data":{"data3":"test11"}}]}',
                Version: '2',
                State: 'drft',
                VersionCreatedDate: '07/09/2022',
            });
        });
    });

    describe('getSchemeWithSubscriptions', () => {
        it('getSchemaWithSubscriptions should get', async () => {
            // Arrange
            const ddbResult = [
                {
                    EventClassification: 'internal',
                    SchemaSupportGroup: 'test@woodside.com.au',
                    Description: 'Testing a Creation of schema. Description',
                    Type: 'Schema',
                    AppName: 'JIRA',
                    OwnerRole: 'Event.User.JIRA',
                    SchemaOwner: 'test@woodside.com.au',
                    SK: '#SCH#wel.test@test-test-TEST-ddb-5',
                    CreatedBy: 'firstName lastName:firstName.lastName@woodside.com.au',
                    Domain: 'wel.test',
                    SchemaName: 'wel.test@test-test-TEST-ddb-5',
                    AppCINumber: '500',
                    PK: 'SCH#wel.test@test-test-TEST-ddb-5',
                    CostCode: '123456',
                    LastUpdated: '07/09/2022',
                    SchemaArn:
                        'arn:aws:schemas:ap-southeast-2:727026770742:schema/EAI-SchemaRegistry-TEST/wel.test@test-test-TEST-ddb-5',
                    Service: 'test-test-TEST-ddb-5',
                    SchemaType: 'JSONSchemaDraft4',
                    VersionCount: 1,
                    AvailableVersions: {
                        '1': 'publ',
                    },
                },
                {
                    LastUpdated: '07/09/2022',
                    VersionCreatedDate: '07/09/2022',
                    LastUpdatedBy: 'firstName lastName:firstName.lastName@woodside.com.au',
                    Version: '1',
                    State: SchemaVersionState.PUBL,
                    Content:
                        '{"$schema":"http://json-schema.org/draft-04/schema#","type":"object","properties":{"detail-type":{"type":"string"},"resources":{"type":"array","items":{"test":"test"}},"detail":{"type":"object","properties":{"Metadata":{"type":"object","properties":{"Guid":{"type":"string"},"Time":{"type":"string"},"Version":{"type":"string"}}},"Data":{"type":"object","properties":{"data":{"type":"string"}}}}},"id":{"type":"string"},"source":{"type":"string"},"time":{"type":"string"},"region":{"type":"string"},"account":{"type":"string"}},"examples":[{"Metadata":{"Guid":"Guid data","Time":"Time data","Version":"1"},"Data":{"data3":"test11"}}]}',
                    SK: 'VER#1',
                    AWSVersion: '2',
                    PK: 'SCH#wel.test@test-test-TEST-ddb-5',
                    Type: 'Version',
                },
            ];
            const schemaResult = [
                {
                    LastUpdatedBy: 'lastName, firstName <firstName.lastName@woodside.com.au>',
                    SubscribingDomain: 'wel.operations.maintenance',
                    EventBusName: 'EAI-EventBus-TEST',
                    SchemaVersion: '1',
                    AppCINumber: 'CITest01',
                    RuleArn:
                        'arn:aws:events:ap-southeast-2:727026770742:rule/EAI-EventBus-TEST/SAP.test.test-test-TEST-ddb-5.qzut9',
                    Targets: ['arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-NP4'],
                    SubscriptionOwner: 'Test',
                    Description: 'test rule',
                    State: SubscriptionState.ENABLED,
                    AppName: 'SAP',
                    OwnerRole: 'Event.User.SAP',
                    LastUpdated: '2022-08-30T05:32:02.510Z',
                    RulePattern:
                        '{"source":["wel.corporate.peopleandglobalcapability"],"detail-type":["LeaveStatusChange"],"detail":{"Metadata":{"Version":["1"]}}}',
                    Broker: BrokerTypes.NP,
                    SchemaName: 'wel.test@test-test-TEST-ddb-5',
                    CreatedBy: 'lastName, firstName <firstName.lastName@woodside.com.au>',
                    PK: 'SAP.test.test-test-TEST-ddb-5.qzut9',
                    CostCode: 'COST-CODE-01',
                    Name: 'SAP.test.test-test-TEST-ddb-5.qzut9',
                },
            ];
            ddbDocMock.on(QueryCommand).resolves({
                $metadata: { httpStatusCode: 200 },
                Count: 2,
                Items: ddbResult,
                ScannedCount: 3,
            });
            jest.spyOn(subscriptionsService, 'getSchemaSubscriptions').mockImplementation(async () => schemaResult);

            // Act
            const result = await schemaService.getSchemaWithSubscriptions('wel.test@test-test-TEST-ddb-5');

            // Assert
            expect(result).toEqual({
                LastUpdatedBy: 'firstName lastName:firstName.lastName@woodside.com.au',
                EventClassification: 'internal',
                SchemaType: 'JSONSchemaDraft4',
                AppCINumber: '500',
                SchemaArn:
                    'arn:aws:schemas:ap-southeast-2:727026770742:schema/EAI-SchemaRegistry-TEST/wel.test@test-test-TEST-ddb-5',
                Service: 'test-test-TEST-ddb-5',
                SchemaSupportGroup: 'test@woodside.com.au',
                Description: 'Testing a Creation of schema. Description',
                AppName: 'JIRA',
                OwnerRole: 'Event.User.JIRA',
                SchemaOwner: 'test@woodside.com.au',
                LastUpdated: '07/09/2022',
                CreatedBy: 'firstName lastName:firstName.lastName@woodside.com.au',
                Domain: 'wel.test',
                SchemaName: 'wel.test@test-test-TEST-ddb-5',
                CostCode: '123456',
                VersionCount: 1,
                AvailableVersions: {
                    '1': 'publ',
                },
                AWSVersion: '2',
                Content:
                    '{"$schema":"http://json-schema.org/draft-04/schema#","type":"object","properties":{"detail-type":{"type":"string"},"resources":{"type":"array","items":{"test":"test"}},"detail":{"type":"object","properties":{"Metadata":{"type":"object","properties":{"Guid":{"type":"string"},"Time":{"type":"string"},"Version":{"type":"string"}}},"Data":{"type":"object","properties":{"data":{"type":"string"}}}}},"id":{"type":"string"},"source":{"type":"string"},"time":{"type":"string"},"region":{"type":"string"},"account":{"type":"string"}},"examples":[{"Metadata":{"Guid":"Guid data","Time":"Time data","Version":"1"},"Data":{"data3":"test11"}}]}',
                Version: '1',
                State: 'publ',
                VersionCreatedDate: '07/09/2022',
                Subscriptions: schemaResult,
            });
        });
    });

    describe('create()', () => {
        it('should create a schema in the registry and database successfully', async () => {
            // Arrange
            const mockSchemaResponse: CreateSchemaCommandOutput = {
                $metadata: { httpStatusCode: 200 },
                SchemaVersion: '1',
                SchemaArn:
                    'arn:aws:schemas:ap-southeast-2:727026770742:schema/EAI-SchemaRegistry-TEST/wel.test@test-test-TEST-ddb-5',
                Type: 'JSONSchemaDraft4',
                LastModified: new Date(),
                VersionCreatedDate: new Date(),
            };
            schemaMock.on(CreateSchemaCommand).resolves(mockSchemaResponse);
            ddbDocMock.on(PutCommand).resolves({ $metadata: { httpStatusCode: 200 } });

            // Act
            const createSchemaDto: CreateSchemaDto = {
                Content:
                    '{"$schema":"http://json-schema.org/draft-04/schema#","type":"object","properties":{"detail-type":{"type":"string"},"resources":{"type":"array","items":{}},"detail":{"type":"object","properties":{"Metadata":{"type":"object","properties":{"Guid":{"type":"string"},"Time":{"type":"string"},"Version":{"type":"string"}}},"Data":{"type":"object","properties":{"data":{"type":"string"}}}}},"id":{"type":"string"},"source":{"type":"string"},"time":{"type":"string"},"region":{"type":"string"},"account":{"type":"string"}},"examples":[{"Metadata":{"Guid":"Guid data","Time":"Time data","Version":"1"},"Data":{"data":"test23"}}]}',
                Description: 'Testing a Creation of schema. Description',
                SchemaName: 'wel.test@test-test-TEST-ddb-6',
                CostCode: '123456',
                SchemaOwner: 'test@woodside.com.au',
                SchemaSupportGroup: 'test@woodside.com.au',
                EventClassification: 'internal',
                AppCINumber: 'CI500',
                AppName: 'testApp',
                OwnerRole: 'Event.User.JIRA',
                Domain: 'wel.test',
            };
            const response = await schemaService.create(createSchemaDto);

            //Assert
            expect(ddbDocMock).toHaveReceivedCommandTimes(PutCommand, 2);
            expect(schemaMock).toHaveReceivedCommand(CreateSchemaCommand);
            expect(response).toEqual({
                ...createSchemaDto,
                SchemaArn: mockSchemaResponse.SchemaArn,
                SchemaType: mockSchemaResponse.Type,
                VersionCount: 1,
                AvailableVersions: {
                    '1': SchemaVersionState.DRFT,
                },
                CreatedBy: generateChangedBy(mockUser),
                LastUpdatedBy: generateChangedBy(mockUser),
                LastUpdated: mockSchemaResponse.LastModified.toISOString(),
                Content: createSchemaDto.Content,
                State: SchemaVersionState.DRFT,
                AWSVersion: mockSchemaResponse.SchemaVersion,
                Version: mockSchemaResponse.SchemaVersion,
                VersionCreatedDate: mockSchemaResponse.VersionCreatedDate.toISOString(),
                Domain: 'wel.test',
            });
        });
    });

    describe('update()', () => {
        it('should not create a new version if Content remains same', async () => {
            // Arrange
            const mockSchemaResponse: UpdateSchemaCommandOutput = {
                $metadata: { httpStatusCode: 200 },
                VersionCreatedDate: new Date(),
                LastModified: new Date(),
                SchemaVersion: '2',
                SchemaArn:
                    'arn:aws:schemas:ap-southeast-2:727026770742:schema/EAI-SchemaRegistry-TEST/wel.test@TestEvent',
                Type: 'JSONSchemaDraft4',
            };
            schemaMock.on(UpdateSchemaCommand).resolves(mockSchemaResponse);

            const mockExistingVersionData = [
                {
                    LastUpdatedBy: 'User, Test <test.user@woodside.com.au>',
                    Version: '1',
                    State: SchemaVersionState.DEPR,
                    Content:
                        '{"$schema":"http://json-schema.org/draft-04/schema#","type":"object","properties":{"detail-type":{"type":"string"},"resources":{"type":"array","items":{"test":"test"}},"detail":{"type":"object","properties":{"Metadata":{"type":"object","properties":{"Guid":{"type":"string"},"Time":{"type":"string"},"Version":{"type":"string"}}},"Data":{"type":"object","properties":{"data":{"type":"string"}}}}},"id":{"type":"string"},"source":{"type":"string"},"time":{"type":"string"},"region":{"type":"string"},"account":{"type":"string"}},"examples":[{"Metadata":{"Guid":"Guid data","Time":"Time data","Version":"1"},"Data":{"data3":"test14"}}]}',
                    SK: 'VER#1',
                    AWSVersion: '1',
                    PK: 'SCH#wel.test@TestEvent',
                    Type: 'Version',
                },
                {
                    LastUpdatedBy: 'User, Test <test.user@woodside.com.au>',
                    Version: '2',
                    State: SchemaVersionState.PUBL,
                    Content:
                        '{"$schema":"http://json-schema.org/draft-04/schema#","type":"object","properties":{"detail-type":{"type":"string"},"resources":{"type":"array","items":{"test":"test"}},"detail":{"type":"object","properties":{"Metadata":{"type":"object","properties":{"Guid":{"type":"string"},"Time":{"type":"string"},"Version":{"type":"string"}}},"Data":{"type":"object","properties":{"data":{"type":"string"}}}}},"id":{"type":"string"},"source":{"type":"string"},"time":{"type":"string"},"region":{"type":"string"},"account":{"type":"string"}},"examples":[{"Metadata":{"Guid":"Guid data","Time":"Time data","Version":"1"},"Data":{"data3":"test15"}}]}',
                    SK: 'VER#2',
                    AWSVersion: '2',
                    PK: 'SCH#wel.test@TestEvent',
                    Type: 'Version',
                },
            ];

            ddbDocMock
                .on(QueryCommand)
                // mock call to get latest schema version
                .resolvesOnce({
                    $metadata: { httpStatusCode: 200 },
                    Count: 1,
                    Items: [mockExistingVersionData[1]],
                })
                // mock call to get all versions including new on
                .resolvesOnce({
                    $metadata: { httpStatusCode: 200 },
                    Count: 2,
                    Items: mockExistingVersionData,
                });

            const updateSchemaDto: UpdateSchemaDto = {
                EventClassification: 'internal',
                Content:
                    '{"$schema":"http://json-schema.org/draft-04/schema#","type":"object","properties":{"detail-type":{"type":"string"},"resources":{"type":"array","items":{"test":"test"}},"detail":{"type":"object","properties":{"Metadata":{"type":"object","properties":{"Guid":{"type":"string"},"Time":{"type":"string"},"Version":{"type":"string"}}},"Data":{"type":"object","properties":{"data":{"type":"string"}}}}},"id":{"type":"string"},"source":{"type":"string"},"time":{"type":"string"},"region":{"type":"string"},"account":{"type":"string"}},"examples":[{"Metadata":{"Guid":"Guid data","Time":"Time data","Version":"1"},"Data":{"data3":"test15"}}]}',
                SchemaSupportGroup: 'test@woodside.com.au',
                Description: 'Testing a Creation of schema. Description.',
                OwnerRole: 'Event.User.JIRA',
                SchemaOwner: 'test@woodside.com.au',
                SchemaName: 'wel.test@test-test-TEST-ddb-5',
                AppCINumber: '500',
                AppName: 'testApp',
                CostCode: '123456',
            };
            // Act
            const response = await schemaService.update(updateSchemaDto);

            // Assert
            expect(ddbDocMock).toHaveReceivedCommandTimes(QueryCommand, 2); // 1 to fetch latest version, 2 to get version count
            expect(ddbDocMock).toHaveReceivedCommandTimes(UpdateCommand, 1); // 1 to update schema
            expect(schemaMock).toHaveReceivedCommandTimes(UpdateSchemaCommand, 1);
            expect(response).toEqual({
                ...updateSchemaDto,
                VersionCount: 2,
                AvailableVersions: {
                    '1': SchemaVersionState.DEPR,
                    '2': SchemaVersionState.PUBL,
                },
                AWSVersion: '2',
                Version: '2',
                SchemaArn: mockSchemaResponse.SchemaArn,
                SchemaType: mockSchemaResponse.Type,
                LastUpdatedBy: generateChangedBy(mockUser),
                LastUpdated: mockSchemaResponse.LastModified.toISOString(),
                State: SchemaVersionState.PUBL,
            });
        });
        it('should not create a new version if only examples in the Content has changed', async () => {
            // Arrange
            const mockSchemaResponse: UpdateSchemaCommandOutput = {
                $metadata: { httpStatusCode: 200 },
                VersionCreatedDate: new Date(),
                LastModified: new Date(),
                SchemaVersion: '2',
                SchemaArn:
                    'arn:aws:schemas:ap-southeast-2:727026770742:schema/EAI-SchemaRegistry-TEST/wel.test@TestEvent',
                Type: 'JSONSchemaDraft4',
            };
            schemaMock.on(UpdateSchemaCommand).resolves(mockSchemaResponse);

            const mockExistingVersionData = [
                {
                    LastUpdatedBy: 'User, Test <test.user@woodside.com.au>',
                    Version: '1',
                    State: SchemaVersionState.DEPR,
                    Content:
                        '{"$schema":"http://json-schema.org/draft-04/schema#","type":"object","properties":{"detail-type":{"type":"string"},"resources":{"type":"array","items":{"test":"test"}},"detail":{"type":"object","properties":{"Metadata":{"type":"object","properties":{"Guid":{"type":"string"},"Time":{"type":"string"},"Version":{"type":"string"}}},"Data":{"type":"object","properties":{"data":{"type":"string"}}}}},"id":{"type":"string"},"source":{"type":"string"},"time":{"type":"string"},"region":{"type":"string"},"account":{"type":"string"}},"examples":[{"Metadata":{"Guid":"Guid data","Time":"Time data","Version":"1"},"Data":{"data3":"test14"}}]}',
                    SK: 'VER#1',
                    AWSVersion: '1',
                    PK: 'SCH#wel.test@TestEvent',
                    Type: 'Version',
                },
                {
                    LastUpdatedBy: 'User, Test <test.user@woodside.com.au>',
                    Version: '2',
                    State: SchemaVersionState.PUBL,
                    Content:
                        '{"$schema":"http://json-schema.org/draft-04/schema#","type":"object","properties":{"detail-type":{"type":"string"},"resources":{"type":"array","items":{"test":"test"}},"detail":{"type":"object","properties":{"Metadata":{"type":"object","properties":{"Guid":{"type":"string"},"Time":{"type":"string"},"Version":{"type":"string"}}},"Data":{"type":"object","properties":{"data":{"type":"string"}}}}},"id":{"type":"string"},"source":{"type":"string"},"time":{"type":"string"},"region":{"type":"string"},"account":{"type":"string"}},"examples":[{"Metadata":{"Guid":"Guid data","Time":"Time data","Version":"1"},"Data":{"data3":"test15"}}]}',
                    SK: 'VER#2',
                    AWSVersion: '2',
                    PK: 'SCH#wel.test@TestEvent',
                    Type: 'Version',
                },
            ];

            ddbDocMock
                .on(QueryCommand)
                // mock call to get latest schema version
                .resolvesOnce({
                    $metadata: { httpStatusCode: 200 },
                    Count: 1,
                    Items: [mockExistingVersionData[1]],
                })
                // mock call to get all versions including new on
                .resolvesOnce({
                    $metadata: { httpStatusCode: 200 },
                    Count: 2,
                    Items: mockExistingVersionData,
                });

            const updateSchemaDto: UpdateSchemaDto = {
                EventClassification: 'internal',
                Content:
                    '{"$schema":"http://json-schema.org/draft-04/schema#","type":"object","properties":{"detail-type":{"type":"string"},"resources":{"type":"array","items":{"test":"test"}},"detail":{"type":"object","properties":{"Metadata":{"type":"object","properties":{"Guid":{"type":"string"},"Time":{"type":"string"},"Version":{"type":"string"}}},"Data":{"type":"object","properties":{"data":{"type":"string"}}}}},"id":{"type":"string"},"source":{"type":"string"},"time":{"type":"string"},"region":{"type":"string"},"account":{"type":"string"}},"examples":[{"Metadata":{"Guid":"Guid data edited","Time":"Time data edited","Version":"2"},"Data":{"data3":"test15"}}]}',
                SchemaSupportGroup: 'test@woodside.com.au',
                Description: 'Testing a Creation of schema. Description.',
                OwnerRole: 'Event.User.JIRA',
                SchemaOwner: 'test@woodside.com.au',
                SchemaName: 'wel.test@test-test-TEST-ddb-5',
                AppCINumber: '500',
                AppName: 'testApp',
                CostCode: '123456',
            };
            // Act
            const response = await schemaService.update(updateSchemaDto);

            // Assert
            expect(ddbDocMock).toHaveReceivedCommandTimes(QueryCommand, 2); // 1 to fetch latest version, 2 to get version count
            expect(ddbDocMock).toHaveReceivedCommandTimes(UpdateCommand, 2); // 1 to update schema
            expect(schemaMock).toHaveReceivedCommandTimes(UpdateSchemaCommand, 1);
            expect(response).toEqual({
                ...updateSchemaDto,
                VersionCount: 2,
                AvailableVersions: {
                    '1': SchemaVersionState.DEPR,
                    '2': SchemaVersionState.PUBL,
                },
                AWSVersion: '2',
                Version: '2',
                SchemaArn: mockSchemaResponse.SchemaArn,
                SchemaType: mockSchemaResponse.Type,
                LastUpdatedBy: generateChangedBy(mockUser),
                LastUpdated: mockSchemaResponse.LastModified.toISOString(),
                State: SchemaVersionState.PUBL,
            });
        });

        it('should create a new draft version if current latest version is published and only if Content (excluding examples) have changed', async () => {
            // Arrange
            const mockSchemaResponse: UpdateSchemaCommandOutput = {
                $metadata: { httpStatusCode: 200 },
                VersionCreatedDate: new Date(),
                LastModified: new Date(),
                SchemaVersion: '3',
                SchemaArn:
                    'arn:aws:schemas:ap-southeast-2:727026770742:schema/EAI-SchemaRegistry-TEST/wel.test@TestEvent',
                Type: 'JSONSchemaDraft4',
            };
            schemaMock.on(UpdateSchemaCommand).resolves(mockSchemaResponse);

            const mockExistingVersionData = [
                {
                    LastUpdatedBy: 'firstName lastName:firstName.lastName@woodside.com.au',
                    Version: '1',
                    State: SchemaVersionState.DEPR,
                    Content:
                        '{"$schema":"http://json-schema.org/draft-04/schema#","type":"object","properties":{"detail-type":{"type":"string"},"resources":{"type":"array","items":{"test":"test"}},"detail":{"type":"object","properties":{"Metadata":{"type":"object","properties":{"Guid":{"type":"string"},"Time":{"type":"string"},"Version":{"type":"string"}}},"Data":{"type":"object","properties":{"data":{"type":"string"}}}}},"id":{"type":"string"},"source":{"type":"string"},"time":{"type":"string"},"region":{"type":"string"},"account":{"type":"string"}},"examples":[{"Metadata":{"Guid":"Guid data","Time":"Time data","Version":"1"},"Data":{"data3":"test14"}}]}',
                    SK: 'VER#1',
                    AWSVersion: '1',
                    PK: 'SCH#wel.test@TestEvent',
                    Type: 'Version',
                },
                {
                    LastUpdatedBy: 'firstName lastName:firstName.lastName@woodside.com.au',
                    Version: '2',
                    State: SchemaVersionState.PUBL,
                    Content:
                        '{"$schema":"http://json-schema.org/draft-04/schema#","type":"object","properties":{"detail-type":{"type":"string"},"resources":{"type":"array","items":{"test":"test"}},"detail":{"type":"object","properties":{"Metadata":{"type":"object","properties":{"Guid":{"type":"string"},"Time":{"type":"string"},"Version":{"type":"string"}}},"Data":{"type":"object","properties":{"data":{"type":"string"}}}}},"id":{"type":"string"},"source":{"type":"string"},"time":{"type":"string"},"region":{"type":"string"},"account":{"type":"string"}},"examples":[{"Metadata":{"Guid":"Guid data","Time":"Time data","Version":"1"},"Data":{"data3":"test15"}}]}',
                    SK: 'VER#2',
                    AWSVersion: '2',
                    PK: 'SCH#wel.test@TestEvent',
                    Type: 'Version',
                },
            ];
            const mockNewVersionData = {
                LastUpdatedBy: 'firstName lastName:firstName.lastName@woodside.com.au',
                Version: '3',
                State: SchemaVersionState.DRFT,
                Content:
                    '{"$schema":"http://json-schema.org/draft-04/schema#","type":"object","properties":{"detail-type":{"type":"string"},"resources":{"type":"array","items":{"test":"test"}},"detail":{"type":"object","properties":{"Metadata":{"type":"object","properties":{"Guid":{"type":"string"},"Time":{"type":"string"},"Version":{"type":"string"}}},"Data":{"type":"object","properties":{"data":{"type":"string"}}}}},"id":{"type":"string"},"source":{"type":"string"},"time":{"type":"string"},"region":{"type":"string"},"account":{"type":"string"}},"examples":[{"Metadata":{"Guid":"Guid data","Time":"Time data","Version":"1"},"Data":{"data3":"test15"}}]}',
                SK: 'VER#3',
                AWSVersion: 3,
                PK: 'SCH#wel.test@TestEvent',
                Type: 'Version',
            };

            ddbDocMock
                .on(QueryCommand)
                // mock call to get latest schema version
                .resolvesOnce({
                    $metadata: { httpStatusCode: 200 },
                    Count: 1,
                    Items: [mockExistingVersionData[1]],
                })
                // mock call to get all versions including new on
                .resolvesOnce({
                    $metadata: { httpStatusCode: 200 },
                    Count: 3,
                    Items: [...mockExistingVersionData, mockNewVersionData],
                });

            const updateSchemaDto: UpdateSchemaDto = {
                EventClassification: 'internal',
                Content:
                    '{"$schema":"http://json-schema.org/draft-04/schema#","type":"object","properties":{"detail-type":{"type":"string"},"resources":{"type":"array","items":{"test":"test"}},"detail":{"type":"object","properties":{"Metadata":{"type":"object","properties":{"Guid":{"type":"string"},"Time":{"type":"string"},"Version":{"type":"string"}}},"Data":{"type":"object","properties":{"name":{"type":"string"}}}}},"id":{"type":"string"},"source":{"type":"string"},"time":{"type":"string"},"region":{"type":"string"},"account":{"type":"string"}},"examples":[{"Metadata":{"Guid":"Guid data","Time":"Time data","Version":"1"},"Data":{"name":"test16"}}]}',
                SchemaSupportGroup: 'test@woodside.com.au',
                Description: 'Testing a Creation of schema. Description.  3',
                OwnerRole: 'Event.User.JIRA',
                SchemaOwner: 'test@woodside.com.au',
                SchemaName: 'wel.test@test-test-TEST-ddb-5',
                AppCINumber: '500',
                AppName: 'testApp',
                CostCode: '123456',
            };
            // Act
            const response = await schemaService.update(updateSchemaDto);
            console.log('what is response', response);

            // Assert
            expect(ddbDocMock).toHaveReceivedCommandTimes(QueryCommand, 2); // 1 to fetch latest version, 2 to get version count
            expect(ddbDocMock).toHaveReceivedCommandTimes(UpdateCommand, 2); // 1 to create new version, 2 to update schema
            expect(schemaMock).toHaveReceivedCommandTimes(UpdateSchemaCommand, 1);
            expect(response).toEqual({
                ...updateSchemaDto,
                VersionCount: 3,
                AvailableVersions: {
                    '1': SchemaVersionState.DEPR,
                    '2': SchemaVersionState.PUBL,
                    '3': SchemaVersionState.DRFT,
                },
                AWSVersion: '3',
                Version: '3',
                SchemaArn: mockSchemaResponse.SchemaArn,
                SchemaType: mockSchemaResponse.Type,
                LastUpdatedBy: generateChangedBy(mockUser),
                LastUpdated: mockSchemaResponse.LastModified.toISOString(),
                State: SchemaVersionState.DRFT,
                VersionCreatedDate: mockSchemaResponse.VersionCreatedDate.toISOString(),
            });
        });
        it('should update the current draft version if latest version is in drft state', async () => {
            // Arrange
            const mockSchemaResponse: UpdateSchemaCommandOutput = {
                $metadata: { httpStatusCode: 200 },
                VersionCreatedDate: new Date(),
                LastModified: new Date(),
                SchemaVersion: '3',
                SchemaArn:
                    'arn:aws:schemas:ap-southeast-2:727026770742:schema/EAI-SchemaRegistry-TEST/wel.test@TestEvent',
                Type: 'JSONSchemaDraft4',
            };
            schemaMock.on(UpdateSchemaCommand).resolves(mockSchemaResponse);

            const mockExistingVersionData = [
                {
                    LastUpdatedBy: 'firstName lastName:firstName.lastName@woodside.com.au',
                    Version: '1',
                    State: SchemaVersionState.PUBL,
                    Content:
                        '{"$schema":"http://json-schema.org/draft-04/schema#","type":"object","properties":{"detail-type":{"type":"string"},"resources":{"type":"array","items":{"test":"test"}},"detail":{"type":"object","properties":{"Metadata":{"type":"object","properties":{"Guid":{"type":"string"},"Time":{"type":"string"},"Version":{"type":"string"}}},"Data":{"type":"object","properties":{"data":{"type":"string"}}}}},"id":{"type":"string"},"source":{"type":"string"},"time":{"type":"string"},"region":{"type":"string"},"account":{"type":"string"}},"examples":[{"Metadata":{"Guid":"Guid data","Time":"Time data","Version":"1"},"Data":{"data3":"test14"}}]}',
                    SK: 'VER#1',
                    AWSVersion: '1',
                    PK: 'SCH#wel.test@TestEvent',
                    Type: 'Version',
                },
                {
                    LastUpdatedBy: 'firstName lastName:firstName.lastName@woodside.com.au',
                    Version: '2',
                    State: SchemaVersionState.DRFT,
                    Content:
                        '{"$schema":"http://json-schema.org/draft-04/schema#","type":"object","properties":{"detail-type":{"type":"string"},"resources":{"type":"array","items":{"test":"test"}},"detail":{"type":"object","properties":{"Metadata":{"type":"object","properties":{"Guid":{"type":"string"},"Time":{"type":"string"},"Version":{"type":"string"}}},"Data":{"type":"object","properties":{"data":{"type":"string"}}}}},"id":{"type":"string"},"source":{"type":"string"},"time":{"type":"string"},"region":{"type":"string"},"account":{"type":"string"}},"examples":[{"Metadata":{"Guid":"Guid data","Time":"Time data","Version":"1"},"Data":{"data3":"test15"}}]}',
                    SK: 'VER#2',
                    AWSVersion: '2',
                    PK: 'SCH#wel.test@TestEvent',
                    Type: 'Version',
                },
            ];

            ddbDocMock
                .on(QueryCommand)
                // mock call to get latest schema version
                .resolvesOnce({
                    $metadata: { httpStatusCode: 200 },
                    Count: 1,
                    Items: [mockExistingVersionData[1]],
                })
                // mock call to get all versions after update
                .resolvesOnce({
                    $metadata: { httpStatusCode: 200 },
                    Count: 2,
                    Items: [...mockExistingVersionData],
                });

            ddbDocMock.on(PutCommand).resolves({ $metadata: { httpStatusCode: 200 } });

            // Act
            const updateSchemaDto: UpdateSchemaDto = {
                EventClassification: 'internal',
                Content:
                    '{"$schema":"http://json-schema.org/draft-04/schema#","type":"object","properties":{"detail-type":{"type":"string"},"resources":{"type":"array","items":{"test":"test"}},"detail":{"type":"object","properties":{"Metadata":{"type":"object","properties":{"Guid":{"type":"string"},"Time":{"type":"string"},"Version":{"type":"string"}}},"Data":{"type":"object","properties":{"data":{"type":"string"}}}}},"id":{"type":"string"},"source":{"type":"string"},"time":{"type":"string"},"region":{"type":"string"},"account":{"type":"string"}},"examples":[{"Metadata":{"Guid":"Guid data","Time":"Time data","Version":"1"},"Data":{"data3":"test16"}}]}',
                SchemaSupportGroup: 'test@woodside.com.au',
                Description: 'Testing a Creation of schema. Description.  3',
                OwnerRole: 'Event.User.JIRA',
                SchemaOwner: 'test@woodside.com.au',
                SchemaName: 'wel.test@test-test-TEST-ddb-5',
                AppCINumber: '500',
                AppName: 'testApp',
                CostCode: '123456',
            };
            const response = await schemaService.update(updateSchemaDto);

            // Assert
            expect(schemaMock).toHaveReceivedCommandTimes(UpdateSchemaCommand, 1);
            expect(ddbDocMock).toHaveReceivedCommandTimes(QueryCommand, 2); // 1 to fetch latest version, 2 to get version count
            expect(ddbDocMock).toHaveReceivedCommandTimes(UpdateCommand, 2); // 1 to create new version, 2 to update schema
            expect(response).toEqual({
                ...updateSchemaDto,
                VersionCount: 2,
                AvailableVersions: {
                    '1': 'publ',
                    '2': 'drft',
                },
                AWSVersion: mockSchemaResponse.SchemaVersion,
                Version: '2',
                SchemaArn: mockSchemaResponse.SchemaArn,
                SchemaType: mockSchemaResponse.Type,
                LastUpdatedBy: generateChangedBy(mockUser),
                LastUpdated: mockSchemaResponse.LastModified.toISOString(),
                State: SchemaVersionState.DRFT,
            });
            // expect(schemaMock).toHaveReceivedCommand(UpdateSchemaCommand);
            // expect(ddbDocMock).toHaveReceivedCommand(QueryCommand);
            // expect(ddbDocMock).toHaveReceivedCommand(UpdateCommand);
        });
    });

    describe('publishSchema()', () => {
        it('should update the latest version to published and deprecate all previous versions', async () => {
            // Arrange
            const mockExistingVersionData = [
                {
                    PK: 'SCH#wel.test@TestEvent',
                    SK: 'VER#1',
                    Type: 'Version',
                    LastUpdatedBy: 'firstName lastName:firstName.lastName@woodside.com.au',
                    Version: '1',
                    State: SchemaVersionState.DEPR,
                    Content: '{}',
                    AWSVersion: '1',
                },
                {
                    PK: 'SCH#wel.test@TestEvent',
                    SK: 'VER#2',
                    Type: 'Version',
                    LastUpdatedBy: 'firstName lastName:firstName.lastName@woodside.com.au',
                    Version: '2',
                    State: SchemaVersionState.PUBL,
                    Content: '{}',
                    AWSVersion: '2',
                },
                {
                    PK: 'SCH#wel.test@TestEvent',
                    SK: 'VER#3',
                    Type: 'Version',
                    LastUpdatedBy: 'firstName lastName:firstName.lastName@woodside.com.au',
                    Version: 3,
                    State: SchemaVersionState.DRFT,
                    Content: '{}',
                    AWSVersion: 3,
                },
            ];
            ddbDocMock.on(QueryCommand).resolves({
                $metadata: { httpStatusCode: 200 },
                Items: mockExistingVersionData,
            });
            ddbDocMock.on(UpdateCommand).resolves({ $metadata: { httpStatusCode: 200 } });

            // Act
            await schemaService.publishSchema('SCH#wel.test@TestEvent');

            // Assert
            expect(ddbDocMock).toHaveReceivedCommandTimes(QueryCommand, 1);
            expect(ddbDocMock).toHaveReceivedCommandTimes(UpdateCommand, mockExistingVersionData.length + 1); // update each version and schema itself
        });
    });

    describe('getRecentEvents', () => {
        it('returns an empty array when no results are found', async () => {
            cloudWatchMock.on(StartQueryCommand).resolves({ queryId: '1234' });
            cloudWatchMock.on(GetQueryResultsCommand).resolves({ status: 'Complete', results: [] });

            const results = await schemaService.getRecentEvents('eventSource', 'eventName', 12);
            expect(results).toEqual([]);
        });

        it('stops searching for more results when finding 10 items', async () => {
            cloudWatchMock.on(StartQueryCommand).resolves({ queryId: '1234' });
            cloudWatchMock.on(StopQueryCommand).resolves({});
            cloudWatchMock
                .on(GetQueryResultsCommand)
                .resolvesOnce({
                    status: 'Running',
                    results: [],
                })
                .resolvesOnce({
                    status: 'Running',
                    results: [
                        [{ field: '@message', value: '{"event":1}' }],
                        [{ field: '@message', value: '{"event":2}' }],
                        [{ field: '@message', value: '{"event":3}' }],
                        [{ field: '@message', value: '{"event":4}' }],
                        [{ field: '@message', value: '{"event":5}' }],
                        [{ field: '@message', value: '{"event":6}' }],
                        [{ field: '@message', value: '{"event":7}' }],
                        [{ field: '@message', value: '{"event":8}' }],
                        [{ field: '@message', value: '{"event":9}' }],
                        [{ field: '@message', value: '{"event":10}' }],
                    ],
                })
                .resolvesOnce({
                    status: 'Complete',
                    results: [],
                });
            const results = await schemaService.getRecentEvents('eventSource', 'eventName', 12);
            expect(results).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
            expect(cloudWatchMock).toHaveReceivedCommandTimes(GetQueryResultsCommand, 2);
        });

        it('correctly parses results from the query', async () => {
            const rawInput = [
                [
                    { field: '@timestamp', value: '2023-06-28 01:50:01.036' },
                    { field: 'event.source', value: 'wel.operations.maintenance' },
                    {
                        field: 'event.detail-type',
                        value: 'MaintenanceNotificationCreated',
                    },
                    { field: 'event.detail.Metadata.Version', value: '1' },
                    {
                        field: '@message',
                        value: '{"cold_start":false,"function_arn":"arn:aws:lambda:ap-southeast-2:144028967590:function:EAI-EventBroker-EventLogger-PRD","function_memory_size":1024,"function_name":"EAI-EventBroker-EventLogger-PRD","function_request_id":"077a7ba2-ea28-42fd-a1f9-9de60f71a970","level":"DEBUG","message":"Event Payload","service":"eventLogger","timestamp":"2023-06-28T01:50:01.036Z","xray_trace_id":"1-649b91c8-533d497c3fc555aa39c29b58","event":{"version":"0","id":"044dcf14-1c11-2591-37d5-dc5de980e840","detail-type":"MaintenanceNotificationCreated","source":"wel.operations.maintenance","account":"144028967590","time":"2023-06-28T01:50:00Z","region":"ap-southeast-2","resources":[],"detail":{"Metadata":{"Guid":"a09b147c-64f5-4fb1-a6b8-504102d2c256","Origin":"SAPECC","Version":"1","Time":"2023-06-28T09:45:57.360Z","MaintenancePlant":"AU01","TechnicalObjectType":"VADE","BusinessKey":"000020439671"},"Data":{"MaintenanceNotification":{"MaintenanceNotification":"000020439671","NotificationText":"60UCV200 failed bladder","MaintNotificationLongText":" ","MaintPriority":"4","MaintPriorityDesc":"4 Routine","NotificationType":"Z1","MainWorkCenter":"01SL","MainWorkCenterText":"Storage & Loading","RequiredStartDate":"2023-06-28T00:00:00.000","RequiredEndDate":"2024-06-22T00:00:00.000","TechnicalObject":"","FunctionalLocation":"AU01.60UCV200","ConcatenatedActiveSystStsName":"OSNO","MaintenanceOrder":"","MaintNotifObjPrtCode":"","MaintNotifObjPrtCodeName":"","MaintNotificationDamageCode":"","MaintNotifDamageCodeName":"","TechnicalObjectType":"VADE","MaintenancePlant":"AU01","MaintNotificationDamageCodeGroup":"","MaintNotifObjPrtCodeGroupName":""}}}}}\n',
                    },
                    {
                        field: '@logStream',
                        value: '2023/06/28/[$LATEST]4b1623d224d64cb390f2bbc45bcd2236',
                    },
                    {
                        field: '@ptr',
                        value: 'CnsKPAo4MTQ0MDI4OTY3NTkwOi9hd3MvbGFtYmRhL0VBSS1FdmVudEJyb2tlci1FdmVudExvZ2dlci1QUkQQAhI5GhgCBkZnchoAAAAAYD7iAwAGSbkawAAAAqIgASjg8cX9jzEwq8jG/Y8xOL0DQOawDkjwhANQvOECGAAQDBgB',
                    },
                ],
            ];

            const parsedOutput = [
                {
                    account: '144028967590',
                    detail: {
                        Data: {
                            MaintenanceNotification: {
                                ConcatenatedActiveSystStsName: 'OSNO',
                                FunctionalLocation: 'AU01.60UCV200',
                                MainWorkCenter: '01SL',
                                MainWorkCenterText: 'Storage & Loading',
                                MaintNotifDamageCodeName: '',
                                MaintNotifObjPrtCode: '',
                                MaintNotifObjPrtCodeGroupName: '',
                                MaintNotifObjPrtCodeName: '',
                                MaintNotificationDamageCode: '',
                                MaintNotificationDamageCodeGroup: '',
                                MaintNotificationLongText: ' ',
                                MaintPriority: '4',
                                MaintPriorityDesc: '4 Routine',
                                MaintenanceNotification: '000020439671',
                                MaintenanceOrder: '',
                                MaintenancePlant: 'AU01',
                                NotificationText: '60UCV200 failed bladder',
                                NotificationType: 'Z1',
                                RequiredEndDate: '2024-06-22T00:00:00.000',
                                RequiredStartDate: '2023-06-28T00:00:00.000',
                                TechnicalObject: '',
                                TechnicalObjectType: 'VADE',
                            },
                        },
                        Metadata: {
                            BusinessKey: '000020439671',
                            Guid: 'a09b147c-64f5-4fb1-a6b8-504102d2c256',
                            MaintenancePlant: 'AU01',
                            Origin: 'SAPECC',
                            TechnicalObjectType: 'VADE',
                            Time: '2023-06-28T09:45:57.360Z',
                            Version: '1',
                        },
                    },
                    'detail-type': 'MaintenanceNotificationCreated',
                    id: '044dcf14-1c11-2591-37d5-dc5de980e840',
                    region: 'ap-southeast-2',
                    resources: [],
                    source: 'wel.operations.maintenance',
                    time: '2023-06-28T01:50:00Z',
                    version: '0',
                },
            ];

            cloudWatchMock.on(StartQueryCommand).resolves({ queryId: '1234' });
            cloudWatchMock.on(GetQueryResultsCommand).resolves({ status: 'Complete', results: rawInput });

            const results = await schemaService.getRecentEvents('eventSource', 'eventName', 12);
            expect(results).toEqual(parsedOutput);
        });
    });

    describe('deleteSchema', () => {
        it('deletes schema and entry in dynamodb', async () => {
            // Arrange
            ddbDocMock.on(DeleteCommand).resolves({
                $metadata: { httpStatusCode: 200 },
            });
            ddbDocMock.on(QueryCommand).resolves({
                $metadata: { httpStatusCode: 200 },
                Count: 2,
                Items: [
                    {
                        PK: 'SCH#wel.test@TestEvent',
                        SK: 'VER#1',
                        Type: 'Version',
                        LastUpdatedBy: 'firstName lastName:firstName.lastName@woodside.com.au',
                        Version: '1',
                        State: SchemaVersionState.DEPR,
                        Content: '',
                        AWSVersion: '2',
                    },
                    {
                        PK: 'SCH#wel.test@TestEvent',
                        SK: 'VER#2',
                        Type: 'Version',
                        LastUpdatedBy: 'firstName lastName:firstName.lastName@woodside.com.au',
                        Version: '2',
                        State: SchemaVersionState.PUBL,
                        Content: '',
                        AWSVersion: 3,
                    },
                ],
                ScannedCount: 3,
            });

            // Act
            await schemaService.delete('wel.test@TestEvent');

            //Assert
            expect(schemaMock).toHaveReceivedCommandTimes(DeleteSchemaCommand, 1);
            expect(ddbDocMock).toHaveReceivedCommandTimes(QueryCommand, 1);
            expect(ddbDocMock).toHaveReceivedCommandTimes(DeleteCommand, 3);
        });
    });

    it('downloadCodeBinding() should create a ts interface for a given schema', async () => {
        // Arrange
        ddbDocMock.on(QueryCommand).resolves({
            $metadata: { httpStatusCode: 200 },
            Count: 3,
            Items: [
                {
                    EventClassification: 'internal',
                    SchemaSupportGroup: 'test@woodside.com.au',
                    Description: 'Testing a Creation of schema. Description.  3',
                    Type: 'Schema',
                    AppName: 'JIRA',
                    OwnerRole: 'Event.User.JIRA',
                    SchemaOwner: 'test@woodside.com.au',
                    SK: '#SCH#wel.test@test-test-TEST-ddb-5',
                    CreatedBy: 'firstName lastName:firstName.lastName@woodside.com.au',
                    Domain: 'wel.test',
                    SchemaName: 'wel.test@test-test-TEST-ddb-5',
                    AppCINumber: '500',
                    PK: 'SCH#wel.test@test-test-TEST-ddb-5',
                    CostCode: '123456',
                },
                {
                    LastUpdatedBy: 'firstName lastName:firstName.lastName@woodside.com.au',
                    Version: '1',
                    State: SchemaVersionState.PUBL,
                    Content:
                        '{"$schema":"http://json-schema.org/draft-04/schema#","type":"object","properties":{"detail-type":{"type":"string"},"resources":{"type":"array","items":{"test":"test"}},"detail":{"type":"object","properties":{"Metadata":{"type":"object","properties":{"Guid":{"type":"string"},"Time":{"type":"string"},"Version":{"type":"string"}}},"Data":{"type":"object","properties":{"data":{"type":"string"}}}}},"id":{"type":"string"},"source":{"type":"string"},"time":{"type":"string"},"region":{"type":"string"},"account":{"type":"string"}},"examples":[{"Metadata":{"Guid":"Guid data","Time":"Time data","Version":"1"},"Data":{"data3":"test14"}}]}',
                    SK: 'VER#1',
                    AWSVersion: '2',
                    PK: 'SCH#wel.test@test-test-TEST-ddb-5',
                    Type: 'Version',
                },
                {
                    LastUpdatedBy: 'firstName lastName:firstName.lastName@woodside.com.au',
                    Version: '2',
                    State: SchemaVersionState.DRFT,
                    Content:
                        '{"$schema":"http://json-schema.org/draft-04/schema#","type":"object","properties":{"detail-type":{"type":"string"},"resources":{"type":"array","items":{"test":"test"}},"detail":{"type":"object","properties":{"Metadata":{"type":"object","properties":{"Guid":{"type":"string"},"Time":{"type":"string"},"Version":{"type":"string"}}},"Data":{"type":"object","properties":{"data":{"type":"string"}}}}},"id":{"type":"string"},"source":{"type":"string"},"time":{"type":"string"},"region":{"type":"string"},"account":{"type":"string"}},"examples":[{"Metadata":{"Guid":"Guid data","Time":"Time data","Version":"1"},"Data":{"data3":"test15"}}]}',
                    SK: 'VER#2',
                    AWSVersion: 3,
                    PK: 'SCH#wel.test@test-test-TEST-ddb-5',
                    Type: 'Version',
                },
            ],
            ScannedCount: 3,
        });

        // Act
        const result = await schemaService.downloadCodeBinding('wel.test@test-test-TEST-ddb-5', '1');
        // Assert
        expect(ddbDocMock).toHaveReceivedCommand(QueryCommand);
    });

    // describe('Version number and state mapping', () => {
    //     it('[New] should create a 1-drft and 1-1 state and number map for newly created schemas', () => {
    //         // Arrange
    //         const schema: SchemaDetails = {};

    //         // Act
    //         // @ts-ignore disabled to allows calling private methods in test cases
    //         const result = schemaService.updateAWSVersionpingTagValues(schema);

    //         // Assert
    //         expect(result).toEqual(['1-drft', '1-1']);
    //     });

    //     it('[Update 1 on drft] should keep a 1-drft state but add 2-1 number map for updating schemas that are still in draft v1', () => {
    //         // Arrange
    //         const schema: SchemaDetails = {
    //             SchemaVersion: '2',
    //             Tags: {
    //                 sysAWSVersion: '1-1',
    //                 sysState: '1-drft',
    //             },
    //         };

    //         // Act
    //         // @ts-ignore disabled to allows calling private methods in test cases
    //         const result = schemaService.updateAWSVersionpingTagValues(schema);

    //         // Assert
    //         expect(result).toEqual(['1-drft', '1-1:2-1']);
    //     });

    //     it('[Update 1 on publ] should create a 2-drft state and 2-2 number map for updates on schemas that are published v1', () => {
    //         // Arrange
    //         const schema: SchemaDetails = {
    //             SchemaVersion: '2',
    //             Tags: {
    //                 sysAWSVersion: '1-1',
    //                 sysState: '1-publ',
    //             },
    //         };

    //         // Act
    //         // @ts-ignore disabled to allows calling private methods in test cases
    //         const result = schemaService.updateAWSVersionpingTagValues(schema);

    //         // Assert
    //         expect(result).toEqual(['1-publ:2-drft', '1-1:2-2']);
    //     });

    //     it('[Update 2 on drft] should keep a 2-drft but add 3-2 state and number map for updated schemas that are draft v2', () => {
    //         // Arrange
    //         const schema: SchemaDetails = {
    //             SchemaVersion: '3',
    //             Tags: {
    //                 sysAWSVersion: '1-1:2-2',
    //                 sysState: '1-publ:2-drft',
    //             },
    //         };

    //         // Act
    //         // @ts-ignore disabled to allows calling private methods in test cases
    //         const result = schemaService.updateAWSVersionpingTagValues(schema);

    //         // Assert
    //         expect(result).toEqual(['1-publ:2-drft', '1-1:2-2:3-2']);
    //     });

    //     it('[Update 3 on publ] should create a 3-drft and 4-3 state and number map for updated schemas that are published v2', () => {
    //         // Arrange
    //         const schema: SchemaDetails = {
    //             SchemaVersion: '4',
    //             Tags: {
    //                 sysAWSVersion: '1-1:2-2:3-2',
    //                 sysState: '1-depr:2-publ',
    //             },
    //         };

    //         // Act
    //         // @ts-ignore disabled to allows calling private methods in test cases
    //         const result = schemaService.updateAWSVersionpingTagValues(schema);

    //         // Assert
    //         expect(result).toEqual(['1-depr:2-publ:3-drft', '1-1:2-2:3-2:4-3']);
    //     });

    //     it('[Update 4 on drft] should keep a 3-drft state but add 5-3 number map for updated schema that is draft v3', () => {
    //         // Arrange
    //         const schema: SchemaDetails = {
    //             SchemaVersion: '5',
    //             Tags: {
    //                 sysAWSVersion: '1-1:2-2:3-2:4-3',
    //                 sysState: '1-depr:2-publ:3-drft',
    //             },
    //         };

    //         // Act
    //         // @ts-ignore disabled to allows calling private methods in test cases
    //         const result = schemaService.updateAWSVersionpingTagValues(schema);

    //         // Assert
    //         expect(result).toEqual(['1-depr:2-publ:3-drft', '1-1:2-2:3-2:4-3:5-3']);
    //     });
    // });

    // describe('Schema version publishing', () => {
    //     it('publishing a version in v1 draft will set it to published', async () => {
    //         // Arrange
    //         ddbDocMock.on(TagResourceCommand).resolves({ $metadata: {} });

    //         // Act
    //         const result = await schemaService.publishSchema({
    //             SchemaArn:
    //                 'arn:aws:schemas:ap-southeast-2:727026770742:schema/EAI-EventRegistry-DEV/wel.example.test@TestEvent1',
    //             SchemaName: 'wel.example.test@TestEvent1',
    //             SchemaVersion: '1',
    //             Tags: {
    //                 sysDomain: 'wel.example.test',
    //                 sysDescription: 'A sample JSONSchema Draft 4 with updated content',
    //                 sysState: '1-drft',
    //                 sysAWSVersion: '1-1',
    //             },
    //             Version: '1',
    //             State: SchemaVersionState.drft,
    //         });

    //         // Assert
    //         expect(result).toEqual({
    //             SchemaArn:
    //                 'arn:aws:schemas:ap-southeast-2:727026770742:schema/EAI-EventRegistry-DEV/wel.example.test@TestEvent1',
    //             SchemaName: 'wel.example.test@TestEvent1',
    //             SchemaVersion: '1',
    //             Tags: {
    //                 sysDomain: 'wel.example.test',
    //                 sysDescription: 'A sample JSONSchema Draft 4 with updated content',
    //                 sysState: '1-publ',
    //                 sysAWSVersion: '1-1',
    //             },
    //             Version: '1',
    //             State: SchemaVersionState.publ,
    //             VersionCount: 1,
    //             AvailableVersions: {
    //                 '1': SchemaVersionState.PUBL,
    //             },
    //         });
    //     });

    //     it('publishing a version in v2 draft will set it to published and deprecate previous version', async () => {
    //         // Arrange
    //         ddbDocMock.on(TagResourceCommand).resolves({ $metadata: {} });

    //         // Act
    //         const result = await schemaService.publishSchema({
    //             SchemaArn:
    //                 'arn:aws:schemas:ap-southeast-2:727026770742:schema/EAI-EventRegistry-DEV/wel.example.test@TestEvent1',
    //             SchemaName: 'wel.example.test@TestEvent1',
    //             SchemaVersion: '2',
    //             Tags: {
    //                 sysDomain: 'wel.example.test',
    //                 sysDescription: 'A sample JSONSchema Draft 4 with updated content',
    //                 sysState: '1-publ:2-drft',
    //                 sysAWSVersion: '1-1:2-2',
    //             },
    //             Version: '2',
    //             State: SchemaVersionState.drft,
    //         });

    //         // Assert
    //         expect(result).toEqual({
    //             SchemaArn:
    //                 'arn:aws:schemas:ap-southeast-2:727026770742:schema/EAI-EventRegistry-DEV/wel.example.test@TestEvent1',
    //             SchemaName: 'wel.example.test@TestEvent1',
    //             SchemaVersion: '2',
    //             Tags: {
    //                 sysDomain: 'wel.example.test',
    //                 sysDescription: 'A sample JSONSchema Draft 4 with updated content',
    //                 sysState: '1-depr:2-publ',
    //                 sysAWSVersion: '1-1:2-2',
    //             },
    //             Version: '2',
    //             State: SchemaVersionState.publ,
    //             VersionCount: 2,
    //             AvailableVersions: {
    //                 '1': 'depr',
    //                 '2': SchemaVersionState.PUBL,
    //             },
    //         });
    //     });

    //     it('publishing a version in v3 draft will set it to published and deprecate previous versions', async () => {
    //         // Arrange
    //         ddbDocMock.on(TagResourceCommand).resolves({ $metadata: {} });

    //         // Act
    //         const result = await schemaService.publishSchema({
    //             SchemaArn:
    //                 'arn:aws:schemas:ap-southeast-2:727026770742:schema/EAI-EventRegistry-DEV/wel.example.test@TestEvent1',
    //             SchemaName: 'wel.example.test@TestEvent1',
    //             SchemaVersion: '5',
    //             Tags: {
    //                 sysDomain: 'wel.example.test',
    //                 sysDescription: 'A sample JSONSchema Draft 4 with updated content',
    //                 sysState: '1-depr:2-publ:3-drft',
    //                 sysAWSVersion: '1-1:2-2:3-3:4-3:5-3',
    //             },
    //             Version: '3',
    //             State: SchemaVersionState.drft,
    //         });

    //         // Assert
    //         expect(result).toEqual({
    //             SchemaArn:
    //                 'arn:aws:schemas:ap-southeast-2:727026770742:schema/EAI-EventRegistry-DEV/wel.example.test@TestEvent1',
    //             SchemaName: 'wel.example.test@TestEvent1',
    //             SchemaVersion: '5',
    //             Tags: {
    //                 sysDomain: 'wel.example.test',
    //                 sysDescription: 'A sample JSONSchema Draft 4 with updated content',
    //                 sysState: '1-depr:2-depr:3-publ',
    //                 sysAWSVersion: '1-1:2-2:3-3:4-3:5-3',
    //             },
    //             Version: '3',
    //             State: SchemaVersionState.publ,
    //             VersionCount: 3,
    //             AvailableVersions: {
    //                 '1': 'depr',
    //                 '2': 'depr',
    //                 '3': SchemaVersionState.PUBL,
    //             },
    //         });
    //     });
    // });
});
