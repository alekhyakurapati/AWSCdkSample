import { Test } from '@nestjs/testing';
import { REQUEST } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import {
    DynamoDBDocument,
    GetCommand,
    PutCommand,
    QueryCommand,
    ScanCommand,
    UpdateCommand,
    GetCommandOutput,
    DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import {
    EventBridge,
    PutTargetsCommand,
    CreateConnectionCommand,
    CreateConnectionCommandOutput,
    UpdateConnectionCommand,
    UpdateConnectionCommandOutput,
    CreateApiDestinationCommand,
    CreateApiDestinationCommandOutput,
    UpdateApiDestinationCommand,
    UpdateApiDestinationCommandOutput,
    DeleteConnectionCommand,
    DeleteApiDestinationCommand,
} from '@aws-sdk/client-eventbridge';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { STS } from '@aws-sdk/client-sts';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';
import { Request } from 'express';

import { BrokerTypes, Connection, Destination } from '@eai-event-integration-platform/interfaces';
import { AuthUser } from '@eai-event-integration-platform/api/auth';
import { AwsService } from '@eai-event-integration-platform/api/aws';
import { RestTargetsService } from './rest-targets.service';
import { RestTargetsInfrastructure } from '../infrastructure/rest-targets.infrastructure';
import { RestTargetsRepository } from '../repository/rest-targets.repository';
import { CreateConnectionDto, UpdateConnectionDto, CreateDestinationDto, UpdateDestinationDto } from '../dto';

const ddbDocMock = mockClient(DynamoDBDocument);
const ebMock = mockClient(EventBridge);

describe('RestTargetsService', () => {
    let restTargetsService: RestTargetsService;

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
                RestTargetsService,
                RestTargetsInfrastructure,
                RestTargetsRepository,
                AwsService,
                {
                    provide: STS,
                    useValue: {},
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
                    provide: ConfigService,
                    useValue: {
                        getOrThrow: jest.fn((key: string) => {
                            switch (key) {
                                case 'NODE_ENV':
                                    return 'test';
                                case 'EVENT_BUS_NAME':
                                    return 'EAI-EventBus-DEV';
                                case 'EVENT_BUS_NAME_NP':
                                    return 'EAI-EventBus-DEV-NP';
                                case 'DLQ_ARN':
                                    return 'arn:aws:sqs:ap-southeast-2:727026770742:EAI-EventBus-TargetDLQ-DEV';
                                case 'DLQ_ARN_NP':
                                    return 'arn:aws:sqs:ap-southeast-2:727026770742:EAI-EventBus-TargetDLQ-DEV-NP';
                                case 'INVOKE_API_DEST_ROLE_ARN':
                                    return 'arn:aws:iam::727026770742:role/EAI-EventBus-InvokeApiDestRole-DEV';
                                case 'INVOKE_API_DEST_ROLE_ARN_NP':
                                    return 'arn:aws:iam::727026770742:role/EAI-EventBus-InvokeApiDestRole-DEV-NP';
                                case 'DDB_SUBSCRIPTIONS_TABLE_NAME':
                                    return 'EAI-EventApiStack-DEV-SubscriptionsTable40965A9D-KMPIABKKZPZ4';
                                default:
                                    throw new Error(`Unkown config value ${key}`);
                            }
                        }),
                    },
                },
                {
                    provide: REQUEST,
                    useValue: mockRequest,
                },
            ],
        }).compile();
        restTargetsService = module.get(RestTargetsService);

        ddbDocMock.reset();
        ebMock.reset();
    });

    it('should be defined', () => {
        expect(restTargetsService).toBeTruthy();
    });

    describe('createConnection()', () => {
        it('should create a connection for valid name and endpoint', async () => {
            const mockConnectionResponse: CreateConnectionCommandOutput = {
                $metadata: { httpStatusCode: 200 },
                ConnectionArn:
                    'arn:aws:events:ap-southeast-2:727026770742:connection/JIRA.blah.ApiConnection-NP/testarn',
                ConnectionState: 'AUTHORIZING',
                CreationTime: new Date(),
                LastModifiedTime: new Date(),
            };
            ebMock.on(CreateConnectionCommand).resolves(mockConnectionResponse);
            const createConnectionDto: CreateConnectionDto = {
                ConnectionName: 'JIRA.blah.ApiConnection-NP',
                Description: 'jest test connection',
                AuthorizationEndpoint:
                    'https://login.microsoftonline.com/a3299bba-ade6-4965-b011-bada8d1d9558/oauth2/v2.0/token',
                HttpMethod: 'GET',
                ClientID: '123456',
                ClientSecret: '1234567',
                Broker: BrokerTypes.NP,
                OwnerRole: 'Event.User.JIRA',
                AppName: 'JIRA',
                Scope: 'api://123456/.default',
            };
            ddbDocMock.on(PutCommand).resolves({ $metadata: { httpStatusCode: 200 } });

            const expectedResult: Connection = {
                ConnectionName: 'JIRA.blah.ApiConnection-NP',
                Description: 'jest test connection',
                AuthorizationEndpoint:
                    'https://login.microsoftonline.com/a3299bba-ade6-4965-b011-bada8d1d9558/oauth2/v2.0/token',
                HttpMethod: 'GET',
                ClientID: '123456',
                Broker: BrokerTypes.NP,
                OwnerRole: 'Event.User.JIRA',
                AppName: 'JIRA',
                ConnectionArn: mockConnectionResponse.ConnectionArn,
                ConnectionState: mockConnectionResponse.ConnectionState,
                LastUpdated: mockConnectionResponse.LastModifiedTime?.toISOString(),
                Scope: 'api://123456/.default',
            };
            const result = await restTargetsService.createConnection(createConnectionDto);
            expect(result).toEqual(expectedResult);
            expect(ddbDocMock).toHaveReceivedCommand(PutCommand);
        });
    });

    describe('updateConnection()', () => {
        it('should update connection when client id exists but client secret is undefined', async () => {
            const mockConnectionResponse: UpdateConnectionCommandOutput = {
                $metadata: { httpStatusCode: 200 },
                ConnectionArn:
                    'arn:aws:events:ap-southeast-2:727026770742:connection/JIRA.blah.ApiConnection-NP/testarn',
                ConnectionState: 'AUTHORIZING',
                CreationTime: new Date(),
                LastModifiedTime: new Date(),
            };
            ebMock.on(UpdateConnectionCommand).resolves(mockConnectionResponse);

            const mockExistingConnectionData = [
                {
                    PK: 'CON#JIRA.blah.ApiConnection-NP',
                    SK: 'CON#JIRA.blah.ApiConnection-NP',
                    AppName: 'JIRA',
                    AuthorizationEndpoint:
                        'https://login.microsoftonline.com/a3299bba-ade6-4965-b011-bada8d1d9558/oauth2/v2.0/token',
                    Broker: 'NP',
                    ClientID: '123456',
                    ConnectionArn: mockConnectionResponse.ConnectionArn,
                    ConnectionName: 'JIRA.blah.ApiConnection-NP',
                    ConnectionState: 'AUTHORIZING',
                    Description: 'jest test connection',
                    HttpMethod: 'GET',
                    LastUpdated: mockConnectionResponse.LastModifiedTime?.toISOString(),
                    OwnerRole: 'Event.User.JIRA',
                    Type: 'Connection',
                    Scope: 'api://123456/.default',
                },
                {
                    PK: 'CON#JIRA.blah2.ApiConnection-NP',
                    SK: 'CON#JIRA.blah2.ApiConnection-NP',
                    AppName: 'JIRA',
                    AuthorizationEndpoint:
                        'https://login.microsoftonline.com/a3299bba-ade6-4965-b011-bada8d1d9558/oauth2/v2.0/token',
                    Broker: 'PRD',
                    ClientID: '123456',
                    ConnectionArn: mockConnectionResponse.ConnectionArn,
                    ConnectionName: 'JIRA.blah2.ApiConnection-NP',
                    ConnectionState: 'AUTHORIZING',
                    Description: 'jest test connection',
                    HttpMethod: 'GET',
                    LastUpdated: mockConnectionResponse.LastModifiedTime?.toISOString(),
                    OwnerRole: 'Event.User.JIRA',
                    Type: 'Connection',
                    Scope: 'api://123456/.default',
                },
            ];
            ddbDocMock.on(QueryCommand).resolvesOnce({
                $metadata: { httpStatusCode: 200 },
                Count: 1,
                Items: [mockExistingConnectionData[0]],
            });

            const updateConnectionDto: UpdateConnectionDto = {
                ConnectionName: 'JIRA.blah.ApiConnection-NP',
                Description: 'jest test connection test update',
                AuthorizationEndpoint:
                    'https://login.microsoftonline.com/a3299bba-ade6-4965-b011-bada8d1d9558/oauth2/v2.0/token',
                HttpMethod: 'GET',
                ClientID: '123456',
                Broker: BrokerTypes.NP,
                OwnerRole: 'Event.User.JIRA',
                AppName: 'JIRA',
                Scope: 'api://123456/.default',
            };

            ebMock.on(PutTargetsCommand).resolves({ $metadata: { httpStatusCode: 200 }, FailedEntryCount: 0 });
            const expectedResult: Connection = {
                ConnectionName: 'JIRA.blah.ApiConnection-NP',
                Description: 'jest test connection test update',
                AuthorizationEndpoint:
                    'https://login.microsoftonline.com/a3299bba-ade6-4965-b011-bada8d1d9558/oauth2/v2.0/token',
                HttpMethod: 'GET',
                ClientID: '123456',
                Broker: BrokerTypes.NP,
                OwnerRole: 'Event.User.JIRA',
                AppName: 'JIRA',
                ConnectionArn: mockConnectionResponse.ConnectionArn,
                ConnectionState: mockConnectionResponse.ConnectionState,
                LastUpdated: mockConnectionResponse.LastModifiedTime?.toISOString(),
                Scope: 'api://123456/.default',
            };

            const result = await restTargetsService.updateConnection(updateConnectionDto);
            expect(result).toEqual(expectedResult);
            expect(ddbDocMock).toHaveReceivedCommandTimes(QueryCommand, 0);
            expect(ddbDocMock).toHaveReceivedCommandTimes(UpdateCommand, 1);
        });
    });

    describe('createDestination()', () => {
        it('should create a destination', async () => {
            const createDestinationDto: CreateDestinationDto = {
                DestinationName: 'JIRA.testdestination.ApiConnection-PRD',
                Description: 'test ',
                InvocationEndpoint: 'https://google.com',
                HttpMethod: 'GET',
                InvocationRateLimitPerSecond: 1,
                Broker: BrokerTypes.PRD,
                ConnectionName: 'JIRA.testconnection.ApiConnection-NP',
                OwnerRole: 'Event.User.JIRA',
                AppName: 'JIRA.testdestination.ApiConnection-PRD',
            };

            const mockDestinationResult: CreateApiDestinationCommandOutput = {
                $metadata: { httpStatusCode: 200 },
                ApiDestinationArn:
                    'arn:aws:events:ap-southeast-2:727026770742:api-destination/JIRA.testdestination.ApiConnection-PRD/testarn',
                LastModifiedTime: new Date(),
                ApiDestinationState: 'INACTIVE',
            };

            const mockConnectionTableData: GetCommandOutput = {
                $metadata: { httpStatusCode: 200 },
                Item: {
                    PK: 'CON#JIRA.testconnection.ApiConnection-NP',
                    SK: 'CON#JIRA.testconnection.ApiConnection-NP',
                    AppName: 'JIRA',
                    AuthorizationEndpoint:
                        'https://login.microsoftonline.com/a3299bba-ade6-4965-b011-bada8d1d9558/oauth2/v2.0/token',
                    Broker: 'NP',
                    ClientID: '123456',
                    ConnectionArn:
                        'arn:aws:events:ap-southeast-2:727026770742:connection/JIRA.testconnection.ApiConnection-NP/testconnection',
                    ConnectionName: 'JIRA.testconnection.ApiConnection-NP',
                    ConnectionState: 'AUTHORIZING',
                    Description: 'test connection payload',
                    HttpMethod: 'GET',
                    LastUpdated: '2022-10-30T13:09:53.000Z',
                    OwnerRole: 'Event.User.JIRA',
                    Type: 'Connection',
                },
            };

            const expectedResult: Destination = {
                InvocationRateLimitPerSecond: 1,
                DestinationName: 'JIRA.testdestination.ApiConnection-PRD',
                Description: 'test ',
                InvocationEndpoint: 'https://google.com',
                HttpMethod: 'GET',
                Broker: BrokerTypes.PRD,
                ConnectionName: 'JIRA.testconnection.ApiConnection-NP',
                OwnerRole: 'Event.User.JIRA',
                AppName: 'JIRA.testdestination.ApiConnection-PRD',
                DestinationArn:
                    'arn:aws:events:ap-southeast-2:727026770742:api-destination/JIRA.testdestination.ApiConnection-PRD/testarn',
                DestinationState: 'INACTIVE',
                LastUpdated: mockDestinationResult.LastModifiedTime?.toISOString(),
            };

            ebMock.on(CreateApiDestinationCommand).resolves(mockDestinationResult);
            ddbDocMock.on(GetCommand).resolves(mockConnectionTableData);

            const result = await restTargetsService.createDestination(createDestinationDto);
            expect(result).toEqual(expectedResult);
            expect(ddbDocMock).toHaveReceivedCommand(PutCommand);
        });
    });

    describe('updateDestination()', () => {
        it('should update the connection', async () => {
            const updateDestinationDto: UpdateDestinationDto = {
                DestinationName: 'JIRA.testdestination.ApiConnection-PRD',
                Description: 'test ',
                InvocationEndpoint: 'https://google.com',
                HttpMethod: 'GET',
                InvocationRateLimitPerSecond: 1,
                Broker: BrokerTypes.PRD,
                ConnectionName: 'JIRA.testconnection.ApiConnection-NP',
                OwnerRole: 'Event.User.JIRA',
                AppName: 'JIRA.testdestination.ApiConnection-PRD',
            };

            const mockDestinationResult: UpdateApiDestinationCommandOutput = {
                $metadata: { httpStatusCode: 200 },
                ApiDestinationArn:
                    'arn:aws:events:ap-southeast-2:727026770742:api-destination/JIRA.testdestination.ApiConnection-PRD/testarn',
                LastModifiedTime: new Date(),
                ApiDestinationState: 'INACTIVE',
            };

            const mockConnectionTableData: GetCommandOutput = {
                $metadata: { httpStatusCode: 200 },
                Item: {
                    PK: 'CON#JIRA.testconnection.ApiConnection-NP',
                    SK: 'CON#JIRA.testconnection.ApiConnection-NP',
                    AppName: 'JIRA',
                    AuthorizationEndpoint:
                        'https://login.microsoftonline.com/a3299bba-ade6-4965-b011-bada8d1d9558/oauth2/v2.0/token',
                    Broker: 'NP',
                    ClientID: '123456',
                    ConnectionArn:
                        'arn:aws:events:ap-southeast-2:727026770742:connection/JIRA.testconnection.ApiConnection-NP/testconnection',
                    ConnectionName: 'JIRA.testconnection.ApiConnection-NP',
                    ConnectionState: 'AUTHORIZING',
                    Description: 'test connection payload',
                    HttpMethod: 'GET',
                    LastUpdated: '2022-10-30T13:09:53.000Z',
                    OwnerRole: 'Event.User.JIRA',
                    Type: 'Connection',
                },
            };

            const expectedResult: Destination = {
                InvocationRateLimitPerSecond: 1,
                DestinationName: 'JIRA.testdestination.ApiConnection-PRD',
                Description: 'test ',
                InvocationEndpoint: 'https://google.com',
                HttpMethod: 'GET',
                Broker: BrokerTypes.PRD,
                ConnectionName: 'JIRA.testconnection.ApiConnection-NP',
                OwnerRole: 'Event.User.JIRA',
                AppName: 'JIRA.testdestination.ApiConnection-PRD',
                DestinationArn:
                    'arn:aws:events:ap-southeast-2:727026770742:api-destination/JIRA.testdestination.ApiConnection-PRD/testarn',
                DestinationState: 'INACTIVE',
                LastUpdated: mockDestinationResult.LastModifiedTime?.toISOString(),
            };

            ebMock.on(UpdateApiDestinationCommand).resolves(mockDestinationResult);
            ddbDocMock.on(GetCommand).resolves(mockConnectionTableData);

            const result = await restTargetsService.updateDestination(
                'JIRA.testconnection.ApiConnection-NP',
                updateDestinationDto,
            );
            expect(result).toEqual(expectedResult);
        });
    });

    describe('listConnection', () => {
        it('should list all the connections', async () => {
            ddbDocMock.on(ScanCommand).resolves({
                $metadata: { httpStatusCode: 200 },
                Items: [
                    {
                        PK: 'CON#JIRA.testconnection.ApiConnection-NP',
                        SK: 'CON#JIRA.testconnection.ApiConnection-NP',
                        AppName: 'JIRA',
                        AuthorizationEndpoint:
                            'https://login.microsoftonline.com/a3299bba-ade6-4965-b011-bada8d1d9558/oauth2/v2.0/token',
                        Broker: 'NP',
                        ClientID: '123456',
                        ConnectionArn:
                            'arn:aws:events:ap-southeast-2:727026770742:connection/JIRA.testconnection.ApiConnection-NP/testarn',
                        ConnectionName: 'JIRA.testconnection.ApiConnection-NP',
                        ConnectionState: 'AUTHORIZING',
                        Description: 'test connection payload',
                        HttpMethod: 'GET',
                        LastUpdated: '2022-10-30T13:09:53.000Z',
                        OwnerRole: 'Event.User.JIRA',
                        Type: 'Connection',
                    },
                    {
                        PK: 'CON#JIRA.testconnection.ApiConnection-NP',
                        SK: 'DEST#JIRA.testdestination.ApiConnection-PRD',
                        AppName: 'JIRA.testdestination.ApiConnection-PRD',
                        Broker: 'PRD',
                        ConnectionName: 'JIRA.testconnection.ApiConnection-NP',
                        Description: 'test ',
                        DestinationArn:
                            'arn:aws:events:ap-southeast-2:727026770742:api-destination/JIRA.testdestination.ApiConnection-PRD/testarn',
                        DestinationName: 'JIRA.testdestination.ApiConnection-PRD',
                        DestinationState: 'INACTIVE',
                        HttpMethod: 'GET',
                        InvocationEndpoint: 'https://google.com',
                        InvocationRateLimitPerSecond: 1,
                        LastUpdated: '2022-10-31T01:15:52.000Z',
                        OwnerRole: 'Event.User.JIRA',
                        Type: 'Destination',
                    },
                ],
            });

            const result = await restTargetsService.getAllSwitch('Connection');

            expect(result).toEqual([
                {
                    AppName: 'JIRA',
                    AuthorizationEndpoint:
                        'https://login.microsoftonline.com/a3299bba-ade6-4965-b011-bada8d1d9558/oauth2/v2.0/token',
                    Broker: 'NP',
                    ClientID: '123456',
                    ConnectionArn:
                        'arn:aws:events:ap-southeast-2:727026770742:connection/JIRA.testconnection.ApiConnection-NP/testarn',
                    ConnectionName: 'JIRA.testconnection.ApiConnection-NP',
                    ConnectionState: 'AUTHORIZING',
                    Description: 'test connection payload',
                    HttpMethod: 'GET',
                    LastUpdated: '2022-10-30T13:09:53.000Z',
                    OwnerRole: 'Event.User.JIRA',
                },
            ]);
        });
    });

    describe('listDestinations', () => {
        it('should list all the destinations', async () => {
            ddbDocMock.on(ScanCommand).resolves({
                $metadata: { httpStatusCode: 200 },
                Items: [
                    {
                        PK: 'CON#JIRA.testconnection.ApiConnection-NP',
                        SK: 'CON#JIRA.testconnection.ApiConnection-NP',
                        AppName: 'JIRA',
                        AuthorizationEndpoint:
                            'https://login.microsoftonline.com/a3299bba-ade6-4965-b011-bada8d1d9558/oauth2/v2.0/token',
                        Broker: 'NP',
                        ClientID: '123456',
                        ConnectionArn:
                            'arn:aws:events:ap-southeast-2:727026770742:connection/JIRA.testconnection.ApiConnection-NP/testarn',
                        ConnectionName: 'JIRA.testconnection.ApiConnection-NP',
                        ConnectionState: 'AUTHORIZING',
                        Description: 'test connection payload',
                        HttpMethod: 'GET',
                        LastUpdated: '2022-10-30T13:09:53.000Z',
                        OwnerRole: 'Event.User.JIRA',
                        Type: 'Connection',
                    },
                    {
                        PK: 'CON#JIRA.testconnection.ApiConnection-NP',
                        SK: 'DEST#JIRA.testdestination.ApiConnection-PRD',
                        AppName: 'JIRA.testdestination.ApiConnection-PRD',
                        Broker: 'PRD',
                        ConnectionName: 'JIRA.testconnection.ApiConnection-NP',
                        Description: 'test ',
                        DestinationArn:
                            'arn:aws:events:ap-southeast-2:727026770742:api-destination/JIRA.testdestination.ApiConnection-PRD/testarn',
                        DestinationName: 'JIRA.testdestination.ApiConnection-PRD',
                        DestinationState: 'INACTIVE',
                        HttpMethod: 'GET',
                        InvocationEndpoint: 'https://google.com',
                        InvocationRateLimitPerSecond: 1,
                        LastUpdated: '2022-10-31T01:15:52.000Z',
                        OwnerRole: 'Event.User.JIRA',
                        Type: 'Destination',
                    },
                ],
            });

            const result = await restTargetsService.getAllSwitch('Destination');

            expect(result).toEqual([
                {
                    AppName: 'JIRA.testdestination.ApiConnection-PRD',
                    Broker: 'PRD',
                    ConnectionName: 'JIRA.testconnection.ApiConnection-NP',
                    Description: 'test ',
                    DestinationArn:
                        'arn:aws:events:ap-southeast-2:727026770742:api-destination/JIRA.testdestination.ApiConnection-PRD/testarn',
                    DestinationName: 'JIRA.testdestination.ApiConnection-PRD',
                    DestinationState: 'INACTIVE',
                    HttpMethod: 'GET',
                    InvocationEndpoint: 'https://google.com',
                    InvocationRateLimitPerSecond: 1,
                    LastUpdated: '2022-10-31T01:15:52.000Z',
                    OwnerRole: 'Event.User.JIRA',
                },
            ]);
        });
    });

    describe('deleteConnection', () => {
        it('should delete connection in dynamodb', async () => {
            ddbDocMock.on(DeleteCommand).resolves({
                $metadata: { httpStatusCode: 200 },
            });
            await restTargetsService.deleteConnection('JIRA.testconnection.ApiConnection-NP');

            expect(ebMock).toHaveReceivedCommandTimes(DeleteConnectionCommand, 1);
            expect(ddbDocMock).toHaveReceivedCommandTimes(DeleteCommand, 1);
        });
    });

    describe('deleteDestination', () => {
        it('should delete destination in dynamodb', async () => {
            ddbDocMock.on(DeleteCommand).resolves({
                $metadata: { httpStatusCode: 200 },
            });
            await restTargetsService.deleteDestination(
                'JIRA.testconnection.ApiConnection-NP',
                'JIRA.testdestination.ApiConnection-PRD',
            );

            expect(ebMock).toHaveReceivedCommandTimes(DeleteApiDestinationCommand, 1);
            expect(ddbDocMock).toHaveReceivedCommandTimes(DeleteCommand, 1);
        });
    });

    describe('getConnection', () => {
        it('should get connection with given connection name', async () => {
            const ddbResult = [
                {
                    PK: 'CON#JIRA.testconnection.ApiConnection-NP',
                    SK: 'CON#JIRA.testconnection.ApiConnection-NP',
                    AppName: 'JIRA',
                    AuthorizationEndpoint:
                        'https://login.microsoftonline.com/a3299bba-ade6-4965-b011-bada8d1d9558/oauth2/v2.0/token',
                    Broker: 'NP',
                    ClientID: '123456',
                    ConnectionArn:
                        'arn:aws:events:ap-southeast-2:727026770742:connection/JIRA.testconnection.ApiConnection-NP/testarn',
                    ConnectionName: 'JIRA.testconnection.ApiConnection-NP',
                    ConnectionState: 'AUTHORIZING',
                    Description: 'test connection payload',
                    HttpMethod: 'GET',
                    LastUpdated: '2022-10-30T13:09:53.000Z',
                    OwnerRole: 'Event.User.JIRA',
                    Type: 'Connection',
                },
            ];

            ddbDocMock.on(GetCommand).resolves({
                $metadata: { httpStatusCode: 200 },
                Item: ddbResult,
            });

            const result = await restTargetsService.getConnection('JIRA.testconnection.ApiConnection-NP');

            expect(result).toEqual([
                {
                    AppName: 'JIRA',
                    AuthorizationEndpoint:
                        'https://login.microsoftonline.com/a3299bba-ade6-4965-b011-bada8d1d9558/oauth2/v2.0/token',
                    Broker: 'NP',
                    ClientID: '123456',
                    ConnectionArn:
                        'arn:aws:events:ap-southeast-2:727026770742:connection/JIRA.testconnection.ApiConnection-NP/testarn',
                    ConnectionName: 'JIRA.testconnection.ApiConnection-NP',
                    ConnectionState: 'AUTHORIZING',
                    Description: 'test connection payload',
                    HttpMethod: 'GET',
                    LastUpdated: '2022-10-30T13:09:53.000Z',
                    OwnerRole: 'Event.User.JIRA',
                    PK: 'CON#JIRA.testconnection.ApiConnection-NP',
                    SK: 'CON#JIRA.testconnection.ApiConnection-NP',
                    Type: 'Connection',
                },
            ]);
        });
    });

    describe('getDestination', () => {
        it('should get destination with the given name', async () => {
            const ddbResult = [
                {
                    PK: 'CON#JIRA.testconnection.ApiConnection-NP',
                    SK: 'DEST#JIRA.testdestination.ApiConnection-PRD',
                    AppName: 'JIRA.testdestination.ApiConnection-PRD',
                    Broker: 'PRD',
                    ConnectionName: 'JIRA.testconnection.ApiConnection-NP',
                    Description: 'test ',
                    DestinationArn:
                        'arn:aws:events:ap-southeast-2:727026770742:api-destination/JIRA.testdestination.ApiConnection-PRD/testarn',
                    DestinationName: 'JIRA.testdestination.ApiConnection-PRD',
                    DestinationState: 'INACTIVE',
                    HttpMethod: 'GET',
                    InvocationEndpoint: 'https://google.com',
                    InvocationRateLimitPerSecond: 1,
                    LastUpdated: '2022-10-31T01:15:52.000Z',
                    OwnerRole: 'Event.User.JIRA',
                    Type: 'Destination',
                },
            ];
            ddbDocMock.on(QueryCommand).resolves({
                $metadata: { httpStatusCode: 200 },
                Items: ddbResult,
            });

            const result = await restTargetsService.getDestinations(
                'JIRA.testconnection.ApiConnection-NP',
                'JIRA.testdestination.ApiConnection-PRD',
            );

            expect(result).toEqual([
                {
                    AppName: 'JIRA.testdestination.ApiConnection-PRD',
                    Broker: 'PRD',
                    ConnectionName: 'JIRA.testconnection.ApiConnection-NP',
                    Description: 'test ',
                    DestinationArn:
                        'arn:aws:events:ap-southeast-2:727026770742:api-destination/JIRA.testdestination.ApiConnection-PRD/testarn',
                    DestinationName: 'JIRA.testdestination.ApiConnection-PRD',
                    DestinationState: 'INACTIVE',
                    HttpMethod: 'GET',
                    InvocationEndpoint: 'https://google.com',
                    InvocationRateLimitPerSecond: 1,
                    LastUpdated: '2022-10-31T01:15:52.000Z',
                    OwnerRole: 'Event.User.JIRA',
                    PK: 'CON#JIRA.testconnection.ApiConnection-NP',
                    SK: 'DEST#JIRA.testdestination.ApiConnection-PRD',
                    Type: 'Destination',
                },
            ]);
        });
    });
});
