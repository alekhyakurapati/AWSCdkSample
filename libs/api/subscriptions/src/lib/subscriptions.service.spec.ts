import { Test } from '@nestjs/testing';
import { REQUEST } from '@nestjs/core';
import { ForbiddenException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    DynamoDBDocument,
    GetCommand,
    PutCommand,
    QueryCommand,
    ScanCommand,
    UpdateCommand,
    DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import {
    DeleteRuleCommand,
    EventBridge,
    EventBridgeServiceException,
    ListTargetsByRuleCommand,
    PutRuleCommand,
    PutTargetsCommand,
    RemoveTargetsCommand,
} from '@aws-sdk/client-eventbridge';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { STS } from '@aws-sdk/client-sts';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';
import { Request } from 'express';

import { BrokerTypes, Subscription, SubscriptionState } from '@eai-event-integration-platform/interfaces';
import { AuthUser } from '@eai-event-integration-platform/api/auth';
import { AwsService } from '@eai-event-integration-platform/api/aws';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsInfrastructure } from './subscriptions.infrastructure';
import { SubscriptionsRepository } from './subscriptions.repository';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from './dto';

const ddbDocMock = mockClient(DynamoDBDocument);
const ebMock = mockClient(EventBridge);

const mockSubscriptions = [
    {
        LastUpdatedBy: 'Grigg, Chris (VERSENT PTY LTD) <chris.grigg@woodside.com.au>',
        SubscribingDomain: 'wel.operations.logistics.yes',
        EventBusName: 'EAI-EventBus-DEV-NP',
        SchemaVersion: '1',
        AppCINumber: 'subscriber ci app num',
        RuleArn: 'arn:aws:events:ap-southeast-2:727026770742:rule/EAI-EventBus-DEV-NP/JIRA.jira.TestEvent.1rjn8',
        Targets: ['arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-NP1'],
        SubscriptionOwner: 'subscription owner',
        Description: 'subscription description',
        State: 'ENABLED',
        AppName: 'JIRA',
        OwnerRole: 'Event.Publisher.JIRA',
        LastUpdated: '2022-08-25T07:58:16.381Z',
        RulePattern:
            '{\n    "source": [\n        "aaa.test.jira"\n    ],\n    "detail-type": [\n        "TestEvent"\n    ],\n    "detail": {\n        "Metadata": {\n            "Version": [\n                "1"\n            ]\n        }\n    }\n}',
        Broker: 'NP',
        CreatedBy: 'Grigg, Chris (VERSENT PTY LTD) <chris.grigg@woodside.com.au>',
        SchemaName: 'aaa.test.jira@TestEvent',
        PK: 'JIRA.jira.TestEvent.1rjn8',
        CostCode: 'subscriber cost code',
        Name: 'JIRA.jira.TestEvent.1rjn8',
    },
    {
        LastUpdatedBy: 'Grigg, Chris (VERSENT PTY LTD) <chris.grigg@woodside.com.au>',
        SubscribingDomain: 'wel.operations.production.FreeText',
        EventBusName: 'EAI-EventBus-DEV-NP',
        SchemaVersion: '1',
        AppCINumber: 'subscriber ci num',
        RuleArn: 'arn:aws:events:ap-southeast-2:727026770742:rule/EAI-EventBus-DEV-NP/JIRA.jira.TestEvent.jkhbw',
        Targets: ['arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-NP1'],
        SubscriptionOwner: 'subscription owner',
        Description: 'subscription des',
        State: 'ENABLED',
        AppName: 'JIRA',
        OwnerRole: 'Event.Publisher.JIRA',
        LastUpdated: '2022-08-25T08:11:34.970Z',
        RulePattern:
            '{\n    "source": [\n        "aaa.test.jira"\n    ],\n    "detail-type": [\n        "TestEvent"\n    ],\n    "detail": {\n        "Metadata": {\n            "Version": [\n                "1"\n            ]\n        }\n    }\n}',
        Broker: 'NP',
        CreatedBy: 'Grigg, Chris (VERSENT PTY LTD) <chris.grigg@woodside.com.au>',
        SchemaName: 'aaa.test.jira@TestEvent',
        PK: 'JIRA.jira.TestEvent.jkhbw',
        CostCode: 'subscriber cost code',
        Name: 'JIRA.jira.TestEvent.jkhbw',
    },
    {
        SubscribingDomain: 'wel.operations.maintenance',
        EventBusName: 'EAI-EventBus-DEV',
        SchemaVersion: '1',
        AppCINumber: '456',
        RuleArn: 'arn:aws:events:ap-southeast-2:727026770742:rule/EAI-EventBus-DEV/SAP.people.UserOnboarded.c3r2q',
        Targets: ['arn:aws:events:ap-southeast-2:981408407928:event-bus/EAI-SubscriberTestEventBus-PRD'],
        SubscriptionOwner: 'Rod',
        Description: 'Subscribe to events',
        State: 'ENABLED',
        AppName: 'SAP',
        OwnerRole: 'Event.User.SAP',
        RulePattern:
            '{"source":["wel.corporate.people"], "detail-type": ["UserOnboarded"],"detail":{"Metadata":{"Version":["1"]}}}',
        Broker: 'PRD',
        SchemaName: 'wel.corporate.people@UserOnboarded',
        PK: 'SAP.people.UserOnboarded.c3r2q',
        CostCode: '123',
        Name: 'SAP.people.UserOnboarded.c3r2q',
    },
    {
        SubscribingDomain: 'wel.operations.maintenance',
        EventBusName: 'EAI-EventBus-DEV-NP',
        SchemaVersion: '1',
        AppCINumber: 'CITest01',
        RuleArn:
            'arn:aws:events:ap-southeast-2:727026770742:rule/EAI-EventBus-DEV-NP/SAP.peopleandglobalcapability.LeaveStatusChange.bbt5g',
        Targets: ['arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-NP'],
        SubscriptionOwner: 'Test',
        Description: 'test rule',
        State: 'ENABLED',
        AppName: 'SAP',
        OwnerRole: 'Event.User.SAP',
        RulePattern:
            '{"source":["wel.corporate.peopleandglobalcapability"],"detail-type":["LeaveStatusChange"],"detail":{"Metadata":{"Version":["1"]}}}',
        Broker: 'NP',
        SchemaName: 'wel.corporate.peopleandglobalcapability@LeaveStatusChange',
        PK: 'SAP.peopleandglobalcapability.LeaveStatusChange.bbt5g',
        CostCode: 'COST-CODE-01',
        Name: 'SAP.peopleandglobalcapability.LeaveStatusChange.bbt5g',
    },
    {
        LastUpdatedBy: 'Grigg, Chris (VERSENT PTY LTD) <chris.grigg@woodside.com.au>',
        SubscribingDomain: 'wel.operations.production.hc-accounting',
        EventBusName: 'EAI-EventBus-DEV-NP',
        SchemaVersion: '1',
        AppCINumber: 'subscriber app ci num',
        RuleArn: 'arn:aws:events:ap-southeast-2:727026770742:rule/EAI-EventBus-DEV-NP/JIRA.jira.TestEvent.8ejg',
        Targets: ['arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-NP1'],
        SubscriptionOwner: 'subscription owner',
        Description: 'subscription description',
        State: 'ENABLED',
        AppName: 'JIRA',
        OwnerRole: 'Event.Publisher.JIRA',
        LastUpdated: '2022-08-25T08:13:30.688Z',
        RulePattern:
            '{\n    "source": [\n        "aaa.test.jira"\n    ],\n    "detail-type": [\n        "TestEvent"\n    ],\n    "detail": {\n        "Metadata": {\n            "Version": [\n                "1"\n            ]\n        }\n    }\n}',
        Broker: 'NP',
        CreatedBy: 'Grigg, Chris (VERSENT PTY LTD) <chris.grigg@woodside.com.au>',
        SchemaName: 'aaa.test.jira@TestEvent',
        PK: 'JIRA.jira.TestEvent.8ejg',
        CostCode: 'subscriber cost code',
        Name: 'JIRA.jira.TestEvent.8ejg',
    },
    {
        LastUpdatedBy: 'Grigg, Chris (VERSENT PTY LTD) <chris.grigg@woodside.com.au>',
        SubscribingDomain: 'wel.operations.quality-sample-analysis.FreeText',
        EventBusName: 'EAI-EventBus-DEV-NP',
        SchemaVersion: '1',
        AppCINumber: 'Subscriber CI Num',
        RuleArn: 'arn:aws:events:ap-southeast-2:727026770742:rule/EAI-EventBus-DEV-NP/JIRA.jira.TestEvent.jx2r',
        Targets: ['arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-NP2'],
        SubscriptionOwner: 'Subscription owner',
        Description: 'Subscription Description',
        State: 'ENABLED',
        AppName: 'JIRA',
        OwnerRole: 'Event.Publisher.JIRA',
        LastUpdated: '2022-08-25T08:03:04.248Z',
        RulePattern:
            '{\n    "source": [\n        "aaa.test.jira"\n    ],\n    "detail-type": [\n        "TestEvent"\n    ],\n    "detail": {\n        "Metadata": {\n            "Version": [\n                "1"\n            ]\n        }\n    }\n}',
        Broker: 'NP',
        CreatedBy: 'Grigg, Chris (VERSENT PTY LTD) <chris.grigg@woodside.com.au>',
        SchemaName: 'aaa.test.jira@TestEvent',
        PK: 'JIRA.jira.TestEvent.jx2r',
        CostCode: 'Subscriber Cost Code',
        Name: 'JIRA.jira.TestEvent.jx2r',
    },
    {
        SubscribingDomain: 'wel.operations.maintenance',
        EventBusName: 'EAI-EventBus-DEV-NP',
        SchemaVersion: '1',
        AppCINumber: '456',
        RuleArn: 'arn:aws:events:ap-southeast-2:727026770742:rule/EAI-EventBus-DEV-NP/SAP.people.UserOnboarded.j1om',
        Targets: [
            'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-NP1',
            'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-NP2',
        ],
        SubscriptionOwner: 'Rod',
        Description: 'Subscribe to events',
        State: 'ENABLED',
        AppName: 'SAP',
        OwnerRole: 'Event.User.SAP',
        RulePattern:
            '{"source":["wel.corporate.people"], "detail-type": ["UserOnboarded"],"detail":{"Metadata":{"Version":["1"]}}}',
        Broker: 'NP',
        SchemaName: 'wel.corporate.people@UserOnboarded',
        PK: 'SAP.people.UserOnboarded.j1om',
        CostCode: '123',
        Name: 'SAP.people.UserOnboarded.j1om',
    },
    {
        LastUpdatedBy: 'Grigg, Chris (VERSENT PTY LTD) <chris.grigg@woodside.com.au>',
        SubscribingDomain: 'wel.operations.production.FreeText',
        EventBusName: 'EAI-EventBus-DEV-NP',
        SchemaVersion: '1',
        AppCINumber: 'subscriber app ci num',
        RuleArn: 'arn:aws:events:ap-southeast-2:727026770742:rule/EAI-EventBus-DEV-NP/JIRA.jira.TestEvent.5hmq',
        Targets: ['arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-NP2'],
        SubscriptionOwner: 'Subscription owner',
        Description: 'subscription description',
        State: 'ENABLED',
        AppName: 'JIRA',
        OwnerRole: 'Event.Publisher.JIRA',
        LastUpdated: '2022-08-25T08:15:59.992Z',
        RulePattern:
            '{\n    "source": [\n        "aaa.test.jira"\n    ],\n    "detail-type": [\n        "TestEvent"\n    ],\n    "detail": {\n        "Metadata": {\n            "Version": [\n                "1"\n            ]\n        }\n    }\n}',
        Broker: 'NP',
        CreatedBy: 'Grigg, Chris (VERSENT PTY LTD) <chris.grigg@woodside.com.au>',
        SchemaName: 'aaa.test.jira@TestEvent',
        PK: 'JIRA.jira.TestEvent.5hmq',
        CostCode: 'subscriber cost code',
        Name: 'JIRA.jira.TestEvent.5hmq',
    },
    {
        LastUpdatedBy: 'Grigg, Chris (VERSENT PTY LTD) <chris.grigg@woodside.com.au>',
        SubscribingDomain: 'wel.operations.production.FreeText',
        EventBusName: 'EAI-EventBus-DEV-NP',
        SchemaVersion: '1',
        AppCINumber: 'subscriber app ci num',
        RuleArn: 'arn:aws:events:ap-southeast-2:727026770742:rule/EAI-EventBus-DEV-NP/JIRA.jira.TestEvent.5hmq',
        Targets: ['arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-NP2'],
        SubscriptionOwner: 'Subscription owner',
        Description: 'subscription description',
        State: 'ENABLED',
        AppName: 'JIRA',
        OwnerRole: 'Event.Publisher.JIRA',
        LastUpdated: '2022-08-25T08:15:59.992Z',
        RulePattern:
            '{\n    "source": [\n        "aaa.test.jira"\n    ],\n    "detail-type": [\n        "TestEvent"\n    ],\n    "detail": {\n        "Metadata": {\n            "Version": [\n                "1"\n            ]\n        }\n    }\n}',
        Broker: null,
        CreatedBy: 'Grigg, Chris (VERSENT PTY LTD) <chris.grigg@woodside.com.au>',
        SchemaName: 'aaa.test.jira@TestEvent',
        PK: 'JIRA.jira.TestEvent.5hmq',
        CostCode: 'subscriber cost code',
        Name: 'JIRA.jira.TestEvent.5hmq',
    },
];

describe('SubscriptionsService', () => {
    let subscriptionService: SubscriptionsService;

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
                SubscriptionsService,
                SubscriptionsInfrastructure,
                SubscriptionsRepository,
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
                                case 'EVENT_BUS_ARN':
                                    return 'arn:aws:events:ap-southeast-2:727026770742:event-bus/EAI-EventBus-DEV';
                                case 'EVENT_BUS_ARN_NP':
                                    return 'arn:aws:events:ap-southeast-2:727026770742:event-bus/EAI-EventBus-DEV-NP';
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
                                case 'PUT_EVENT_BUS_DEST_ROLE_ARN':
                                    return 'arn:aws:iam::727026770742:role/EAI-EventBus-PutEventBusDestRole-DEV';
                                case 'PUT_EVENT_BUS_DEST_ROLE_ARN_NP':
                                    return 'arn:aws:iam::727026770742:role/EAI-EventBus-PutEventBusDestRole-DEV-NP';
                                default:
                                    throw new Error(`Unkown config value ${key}`);
                            }
                        }),
                    },
                },
                { provide: REQUEST, useValue: mockRequest },
            ],
        }).compile();
        subscriptionService = module.get(SubscriptionsService);

        // override the generateRuleName() to return a fixed value
        // use <Class>.prototype as any to overcome mocking private methods
        jest.spyOn(SubscriptionsService.prototype as any, 'generateRuleName').mockImplementation(() => 'TestRuleName');

        ddbDocMock.reset();
        ebMock.reset();
    });

    it('should be defined', () => {
        expect(subscriptionService).toBeTruthy();
    });

    describe('createSubscription()', () => {
        it('should create a rule and targets for valid NP subscription', async () => {
            // Arrange
            const ruleArn = `arn:aws:events:ap-southeast-2:727026770742:rule/EAI-EventBus-DEV-NP/TestRuleName`;
            const createSubscriptionDto: CreateSubscriptionDto = {
                SchemaName: 'wel.corporate.people@UserOnboarded',
                SchemaVersion: '1',
                Description: 'Subscribe to events',
                Targets: [
                    'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-NP',
                    'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-NP1',
                ],
                RulePattern:
                    '{"source":["wel.corporate.people"], "detail-type": ["UserOnboarded"],"detail":{"Metadata":{"Version":["1"]}}}',
                CostCode: 'COST-CODE-01',
                AppName: 'SAP',
                AppCINumber: 'CITest01',
                SubscriptionOwner: 'Tester',
                SubscribingDomain: 'wel.operations.maintenance',
                OwnerRole: 'Event.User.SAP',
                Broker: BrokerTypes.NP,
                State: SubscriptionState.ENABLED,
            };
            ddbDocMock.on(PutCommand).resolves({ $metadata: { httpStatusCode: 200 } });
            ebMock.on(PutRuleCommand).resolves({
                $metadata: { httpStatusCode: 200 },
                RuleArn: ruleArn,
            });
            ebMock.on(PutTargetsCommand).resolves({ $metadata: { httpStatusCode: 200 }, FailedEntryCount: 0 });
            const expectedResult: Subscription = {
                ...createSubscriptionDto,
                Name: 'TestRuleName', // generated rule name
                EventBusName: 'arn:aws:events:ap-southeast-2:727026770742:event-bus/EAI-EventBus-DEV-NP', // busname based on brokerType
                RuleArn: ruleArn, // mock returned ruleArn
                CreatedBy: `${mockUser.name} <${mockUser.username}>`,
                LastUpdatedBy: `${mockUser.name} <${mockUser.username}>`,
            };

            // Act
            const result = await subscriptionService.createSubscription(createSubscriptionDto);
            // Assert
            expectedResult.LastUpdated = result.LastUpdated;
            expect(result).toEqual(expectedResult);
            expect(ddbDocMock).toHaveReceivedCommand(PutCommand);
            expect(ebMock).toHaveReceivedCommand(PutRuleCommand);
            expect(ebMock).toHaveReceivedCommand(PutTargetsCommand);
        });

        it('should create a rule and single target for valid PRD subscription', async () => {
            // Arrange
            const ruleArn = `arn:aws:events:ap-southeast-2:727026770742:rule/EAI-EventBus-DEV/TestRuleName`;
            const createSubscriptionDto: CreateSubscriptionDto = {
                SchemaName: 'wel.corporate.people@UserOnboarded',
                SchemaVersion: '1',
                Description: 'Subscribe to events',
                Targets: [
                    'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-PRD',
                    'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-PRD1',
                ],
                RulePattern:
                    '{"source":["wel.corporate.people"], "detail-type": ["UserOnboarded"],"detail":{"Metadata":{"Version":["1"]}}}',
                CostCode: 'COST-CODE-01',
                AppName: 'SAP',
                AppCINumber: 'CITest01',
                SubscriptionOwner: 'Tester',
                SubscribingDomain: 'wel.operations.maintenance',
                OwnerRole: 'Event.User.SAP',
                Broker: BrokerTypes.PRD,
                State: SubscriptionState.ENABLED,
            };
            ddbDocMock.on(PutCommand).resolves({ $metadata: { httpStatusCode: 200 } });
            ebMock.on(PutRuleCommand).resolves({
                $metadata: { httpStatusCode: 200 },
                RuleArn: ruleArn,
            });
            ebMock.on(PutTargetsCommand).resolves({ $metadata: { httpStatusCode: 200 }, FailedEntryCount: 0 });
            const expectedResult: Subscription = {
                ...createSubscriptionDto,
                Targets: [createSubscriptionDto.Targets![0]], // only first target is picked for PRD
                Name: 'TestRuleName', // generated rule name
                EventBusName: 'arn:aws:events:ap-southeast-2:727026770742:event-bus/EAI-EventBus-DEV', // busname based on brokerType
                RuleArn: ruleArn, // mock returned ruleArn
                CreatedBy: `${mockUser.name} <${mockUser.username}>`,
                LastUpdatedBy: `${mockUser.name} <${mockUser.username}>`,
            };
            // Act
            const result = await subscriptionService.createSubscription(createSubscriptionDto);

            // Assert
            expectedResult.LastUpdated = result.LastUpdated;
            expect(result).toEqual(expectedResult);
            expect(ddbDocMock).toHaveReceivedCommand(PutCommand);
            expect(ebMock).toHaveReceivedCommand(PutRuleCommand);
            expect(ebMock).toHaveReceivedCommand(PutTargetsCommand);
        });

        it('should remove the rule if an error is thrown', async () => {
            // Arrange
            const ruleArn = `arn:aws:events:ap-southeast-2:727026770742:rule/EAI-EventBus-DEV/TestRuleName`;
            const createSubscriptionDto: CreateSubscriptionDto = {
                SchemaName: 'wel.corporate.people@UserOnboarded',
                SchemaVersion: '1',
                Description: 'Subscribe to events',
                Targets: ['arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-PRD'],
                RulePattern:
                    '{"source":["wel.corporate.people"], "detail-type": ["UserOnboarded"],"detail":{"Metadata":{"Version":["1"]}}}',
                CostCode: 'COST-CODE-01',
                AppName: 'SAP',
                AppCINumber: 'CITest01',
                SubscriptionOwner: 'Tester',
                SubscribingDomain: 'wel.operations.maintenance',
                OwnerRole: 'Event.User.SAP',
                Broker: BrokerTypes.PRD,
                State: SubscriptionState.ENABLED,
            };
            ebMock.on(PutRuleCommand).resolves({
                $metadata: { httpStatusCode: 200 },
                RuleArn: ruleArn,
            });
            ebMock.on(PutTargetsCommand).rejects(); // PutTargets throws error

            try {
                // Act
                await subscriptionService.createSubscription(createSubscriptionDto);
            } catch (error) {
                // Assert
                expect(error).toBeInstanceOf(InternalServerErrorException);
                expect(ebMock).toHaveReceivedCommandWith(DeleteRuleCommand, {
                    Name: 'TestRuleName',
                    EventBusName: 'arn:aws:events:ap-southeast-2:727026770742:event-bus/EAI-EventBus-DEV',
                });
            }
        });

        it('should return a ForbiddenException error when adding a target with invalid policies', async () => {
            // Arrange
            const ruleArn = `arn:aws:events:ap-southeast-2:727026770742:rule/EAI-EventBus-DEV/TestRuleName`;
            const createSubscriptionDto: CreateSubscriptionDto = {
                SchemaName: 'wel.corporate.people@UserOnboarded',
                SchemaVersion: '1',
                Description: 'Subscribe to events',
                Targets: ['arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-PRD'],
                RulePattern:
                    '{"source":["wel.corporate.people"], "detail-type": ["UserOnboarded"],"detail":{"Metadata":{"Version":["1"]}}}',
                CostCode: 'COST-CODE-01',
                AppName: 'SAP',
                AppCINumber: 'CITest01',
                SubscriptionOwner: 'Tester',
                SubscribingDomain: 'wel.operations.maintenance',
                OwnerRole: 'Event.User.SAP',
                Broker: BrokerTypes.PRD,
                State: SubscriptionState.ENABLED,
            };
            ebMock.on(PutRuleCommand).resolves({
                $metadata: { httpStatusCode: 200 },
                RuleArn: ruleArn,
            });
            ebMock.on(PutTargetsCommand).rejects(
                new EventBridgeServiceException({
                    $metadata: { httpStatusCode: 400 },
                    $fault: 'client',
                    name: 'AccessDeniedException',
                }),
            );

            try {
                // Act
                await subscriptionService.createSubscription(createSubscriptionDto);
            } catch (error: any) {
                // Assert
                const targetArns = createSubscriptionDto.Targets?.join(',');
                expect(error).toBeInstanceOf(ForbiddenException);
                expect(error.message).toEqual(
                    `Please ensure the target Eventbus: ${targetArns} exists and have the right resource based policies configured.`,
                );
                expect(ebMock).toHaveReceivedCommandWith(DeleteRuleCommand, {
                    Name: 'TestRuleName',
                    EventBusName: 'arn:aws:events:ap-southeast-2:727026770742:event-bus/EAI-EventBus-DEV',
                });
            }
        });
    });

    describe('updateSubscription', () => {
        it('should update a rule details only if targets have not changed', async () => {
            // Arrange
            const subscriptionName = 'TestRuleName';
            const eventBusName = 'arn:aws:events:ap-southeast-2:727026770742:event-bus/EAI-EventBus-DEV-NP';
            const ruleArn = 'arn:aws:events:ap-southeast-2:727026770742:rule/EAI-EventBus-DEV-NP/TestRuleName';
            const subscriptionDto: UpdateSubscriptionDto = {
                SchemaName: 'wel.corporate.people@UserOnboarded',
                SchemaVersion: '1',
                Description: 'Subscribe to events',
                Targets: [
                    'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-NP',
                    'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-NP1',
                ],
                RulePattern:
                    '{"source":["wel.corporate.people"], "detail-type": ["UserOnboarded"],"detail":{"Metadata":{"Version":["1"]}}}',
                CostCode: 'COST-CODE-01',
                AppName: 'SAP',
                AppCINumber: 'CITest01',
                SubscriptionOwner: 'Tester',
                SubscribingDomain: 'wel.operations.maintenance',
                OwnerRole: 'Event.User.SAP',
                Broker: BrokerTypes.NP,
                State: SubscriptionState.ENABLED,
            };
            ebMock.on(PutRuleCommand).resolves({
                $metadata: { httpStatusCode: 200 },
                RuleArn: ruleArn,
            });
            ebMock.on(ListTargetsByRuleCommand).resolves({
                $metadata: { httpStatusCode: 200 },
                Targets: [
                    {
                        Arn: 'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-NP',
                        Id: '123',
                    },
                    {
                        Arn: 'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-NP1',
                        Id: '456',
                    },
                ],
            });
            ddbDocMock.on(UpdateCommand).resolves({ $metadata: { httpStatusCode: 200 } });
            const expectedResult: Subscription = {
                ...subscriptionDto,
                Name: subscriptionName,
                EventBusName: eventBusName,
                RuleArn: ruleArn,
                LastUpdatedBy: `${mockUser.name} <${mockUser.username}>`,
            };

            // Act
            const result = await subscriptionService.updateSubscription(subscriptionName, subscriptionDto);

            // Assert
            expectedResult.LastUpdated = result.LastUpdated;
            expect(result).toEqual(expectedResult);
            expect(ebMock).toHaveReceivedCommand(PutRuleCommand);
            expect(ebMock).not.toHaveReceivedCommand(PutTargetsCommand);
            expect(ebMock).not.toHaveReceivedCommand(RemoveTargetsCommand);
            expect(ddbDocMock).toHaveReceivedCommand(UpdateCommand);
        });

        it('should update a rule details and add targets if there are new ones listed', async () => {
            // Arrange
            const subscriptionName = 'TestRuleName';
            const eventBusName = 'arn:aws:events:ap-southeast-2:727026770742:event-bus/EAI-EventBus-DEV-NP';
            const ruleArn = 'arn:aws:events:ap-southeast-2:727026770742:rule/EAI-EventBus-DEV-NP/TestRuleName';
            const subscriptionDto: UpdateSubscriptionDto = {
                SchemaName: 'wel.corporate.people@UserOnboarded',
                SchemaVersion: '1',
                Description: 'Subscribe to events',
                Targets: [
                    'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-NP',
                    'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-NP1',
                    'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-NP2', // new target
                ],
                RulePattern:
                    '{"source":["wel.corporate.people"], "detail-type": ["UserOnboarded"],"detail":{"Metadata":{"Version":["1"]}}}',
                CostCode: 'COST-CODE-01',
                AppName: 'SAP',
                AppCINumber: 'CITest01',
                SubscriptionOwner: 'Tester',
                SubscribingDomain: 'wel.operations.maintenance',
                OwnerRole: 'Event.User.SAP',
                Broker: BrokerTypes.NP,
                State: SubscriptionState.ENABLED,
            };
            ebMock.on(PutRuleCommand).resolves({
                $metadata: { httpStatusCode: 200 },
                RuleArn: ruleArn,
            });
            ebMock
                .on(ListTargetsByRuleCommand) // mock calls to fetch targets
                .resolvesOnce({
                    $metadata: { httpStatusCode: 200 },
                    Targets: [
                        {
                            Arn: 'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-NP',
                            Id: '123',
                        },
                        {
                            Arn: 'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-NP1',
                            Id: '456',
                        },
                    ],
                })
                .resolvesOnce({
                    $metadata: { httpStatusCode: 200 },
                    Targets: [
                        {
                            Arn: 'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-NP',
                            Id: '123',
                        },
                        {
                            Arn: 'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-NP1',
                            Id: '456',
                        },
                        {
                            Arn: 'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-NP2',
                            Id: '789',
                        },
                    ],
                });
            ebMock.on(PutTargetsCommand).resolves({ $metadata: { httpStatusCode: 200 } });
            ddbDocMock.on(UpdateCommand).resolves({ $metadata: { httpStatusCode: 200 } });
            const expectedResult: Subscription = {
                ...subscriptionDto,
                Name: subscriptionName,
                EventBusName: eventBusName,
                RuleArn: ruleArn,
                LastUpdatedBy: `${mockUser.name} <${mockUser.username}>`,
            };

            // Act
            const result = await subscriptionService.updateSubscription(subscriptionName, subscriptionDto);

            // Assert
            expectedResult.LastUpdated = result.LastUpdated;
            expect(result).toEqual(expectedResult);
            expect(ebMock).toHaveReceivedCommand(PutRuleCommand);
            expect(ebMock).toHaveReceivedCommand(PutTargetsCommand);
            expect(ebMock).not.toHaveReceivedCommand(RemoveTargetsCommand);
            expect(ddbDocMock).toHaveReceivedCommand(UpdateCommand);
        });

        it('should update a rule details and remove targets if there are ones missing', async () => {
            // Arrange
            const subscriptionName = 'TestRuleName';
            const eventBusName = 'arn:aws:events:ap-southeast-2:727026770742:event-bus/EAI-EventBus-DEV-NP';
            const ruleArn = 'arn:aws:events:ap-southeast-2:727026770742:rule/EAI-EventBus-DEV-NP/TestRuleName';
            const subscriptionDto: UpdateSubscriptionDto = {
                SchemaName: 'wel.corporate.people@UserOnboarded',
                SchemaVersion: '1',
                Description: 'Subscribe to events',
                Targets: ['arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-NP'],
                RulePattern:
                    '{"source":["wel.corporate.people"], "detail-type": ["UserOnboarded"],"detail":{"Metadata":{"Version":["1"]}}}',
                CostCode: 'COST-CODE-01',
                AppName: 'SAP',
                AppCINumber: 'CITest01',
                SubscriptionOwner: 'Tester',
                SubscribingDomain: 'wel.operations.maintenance',
                OwnerRole: 'Event.User.SAP',
                Broker: BrokerTypes.NP,
                State: SubscriptionState.ENABLED,
            };
            ebMock.on(PutRuleCommand).resolves({
                $metadata: { httpStatusCode: 200 },
                RuleArn: ruleArn,
            });
            ebMock
                .on(ListTargetsByRuleCommand) // mock calls to fetch targets
                .resolvesOnce({
                    $metadata: { httpStatusCode: 200 },
                    Targets: [
                        {
                            Arn: 'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-NP',
                            Id: '123',
                        },
                        {
                            Arn: 'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-NP1', // missing
                            Id: '456',
                        },
                    ],
                })
                .resolvesOnce({
                    $metadata: { httpStatusCode: 200 },
                    Targets: [
                        {
                            Arn: 'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-NP',
                            Id: '789',
                        },
                    ],
                });
            ebMock.on(PutTargetsCommand).resolves({ $metadata: { httpStatusCode: 200 } });
            ddbDocMock.on(UpdateCommand).resolves({ $metadata: { httpStatusCode: 200 } });

            const expectedResult: Subscription = {
                ...subscriptionDto,
                Name: subscriptionName,
                EventBusName: eventBusName,
                RuleArn: ruleArn,
                LastUpdatedBy: `${mockUser.name} <${mockUser.username}>`,
            };

            // Act
            const result = await subscriptionService.updateSubscription(subscriptionName, subscriptionDto);

            // Assert
            expectedResult.LastUpdated = result.LastUpdated;
            expect(result).toEqual(expectedResult);
            expect(ebMock).toHaveReceivedCommand(PutRuleCommand);
            expect(ebMock).not.toHaveReceivedCommand(PutTargetsCommand);
            expect(ebMock).toHaveReceivedCommand(RemoveTargetsCommand);
            expect(ddbDocMock).toHaveReceivedCommand(UpdateCommand);
        });
    });

    describe('listSubscriptions()', () => {
        it('should return all subscriptions with no filter provided', async () => {
            // Arrange
            ddbDocMock.on(ScanCommand).resolves({
                $metadata: { httpStatusCode: 200 },
                Items: mockSubscriptions,
            });

            //Act
            const result = await subscriptionService.getSubscriptions();

            //Assert
            expect(result).toEqual(mockSubscriptions);
        });

        it('should return schema subscriptions with a schemaName parameter provided', async () => {
            // Arrange
            const schemaName = 'wel.operations.maintenance@WorkOrderStatusChange';
            const filteredSubscriptions = mockSubscriptions.filter((s) => s.SchemaName === schemaName);
            ddbDocMock.on(QueryCommand).resolves({
                $metadata: { httpStatusCode: 200 },
                Items: filteredSubscriptions,
            });

            //Act
            const result = await subscriptionService.getSubscriptions(schemaName);

            //Assert
            expect(result).toEqual(filteredSubscriptions);
        });

        it('should return user subscriptions when user-owned flag is provided', async () => {
            // Arrange
            const filteredSubscriptions = mockSubscriptions.filter((s) => mockUser.roles.includes(s.OwnerRole));
            ddbDocMock.on(ScanCommand).resolves({
                $metadata: { httpStatusCode: 200 },
                Items: filteredSubscriptions,
            });

            //Act
            const result = await subscriptionService.getSubscriptions(undefined, true);

            //Assert
            expect(result).toEqual(filteredSubscriptions);
        });
    });

    describe('getSubscription', () => {
        it('should return a subscription from a name', async () => {
            // Arrange
            const subscription = mockSubscriptions[0];
            ddbDocMock.on(GetCommand).resolves({
                $metadata: { httpStatusCode: 200 },
                Item: subscription,
            });

            //Act
            const result = await subscriptionService.getSubscription(subscription.Name);

            //Assert
            expect(result).toEqual(subscription);
        });
        it('should throw a NotFoundException if subscription not found', async () => {
            // Arrange
            ddbDocMock.on(GetCommand).resolves({
                $metadata: { httpStatusCode: 200 },
                Item: undefined,
            });

            try {
                //Act
                await subscriptionService.getSubscription('UnknownSubscriptionName');
            } catch (error) {
                //Assert
                expect(error).toBeInstanceOf(NotFoundException);
            }
        });
    });

    // TODO
    // describe('Update()', () => {

    // });

    describe('deleteSubscription', () => {
        it('should call appropriate commands in Enterprise bus and Dynamodb when delete is called', async () => {
            // Arrange
            const subscription = mockSubscriptions[0];
            ddbDocMock.on(GetCommand).resolves({
                $metadata: { httpStatusCode: 200 },
                Item: subscription,
            });

            ebMock.on(ListTargetsByRuleCommand).resolves({
                $metadata: { httpStatusCode: 200 },
                Targets: [
                    {
                        Arn: 'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-NP',
                        Id: '123',
                    },
                    {
                        Arn: 'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-NP1',
                        Id: '456',
                    },
                ],
            });
            ebMock.on(RemoveTargetsCommand).resolves({ $metadata: { httpStatusCode: 200 } });

            ddbDocMock.on(DeleteCommand).resolves({ $metadata: { httpStatusCode: 200 } });

            // Act
            await subscriptionService.delete(subscription.Name);

            // Assert
            expect(ebMock).toHaveReceivedCommandWith(RemoveTargetsCommand, {
                Rule: 'JIRA.jira.TestEvent.1rjn8',
                EventBusName: 'arn:aws:events:ap-southeast-2:727026770742:event-bus/EAI-EventBus-DEV-NP',
                Ids: ['123', '456'],
            });
            expect(ebMock).toHaveReceivedCommandWith(DeleteRuleCommand, {
                Name: 'JIRA.jira.TestEvent.1rjn8',
                EventBusName: 'arn:aws:events:ap-southeast-2:727026770742:event-bus/EAI-EventBus-DEV-NP',
            });
            expect(ddbDocMock).toHaveReceivedCommand(DeleteCommand);
        });

        it('should throw InternalServerException when Broker field is null', async () => {
            // Arrange
            const nullBrokerSubscription = mockSubscriptions[8];
            try {
                //Act
                await subscriptionService.delete(nullBrokerSubscription.Name);
            } catch (error) {
                //Assert
                expect(error).toBeInstanceOf(InternalServerErrorException);
            }
        });
    });
});
