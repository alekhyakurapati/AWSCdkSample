import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import { Request } from 'express';
import { BrokerTypes, Subscription, SubscriptionState } from '@eai-event-integration-platform/interfaces';
import { AuthUser } from '@eai-event-integration-platform/api/auth';
import { AwsService } from '@eai-event-integration-platform/api/aws';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { REQUEST } from '@nestjs/core';
import { SubscriptionsInfrastructure } from './subscriptions.infrastructure';
import { SubscriptionsRepository } from './subscriptions.repository';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from './dto';
import { UnauthorizedException } from '@nestjs/common';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { EventBridge } from '@aws-sdk/client-eventbridge';
import { STS } from '@aws-sdk/client-sts';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';

const ddbDocMock = mockClient(DynamoDBDocument);
const ebMock = mockClient(EventBridge);

describe('SubscriptionsController', () => {
    let controller: SubscriptionsController;
    let service: SubscriptionsService;
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
                                    return 'arn:aws:sqs:ap-southeast-2:727026770742:EAI-EventBus-TargetDLQ-TEST';
                                case 'DLQ_ARN_NP':
                                    return 'arn:aws:sqs:ap-southeast-2:727026770742:EAI-EventBus-TargetDLQ-TEST-NP';
                                case 'INVOKE_API_DEST_ROLE_ARN':
                                    return 'arn:aws:iam::727026770742:role/EAI-EventBus-InvokeApiDestRole-DEV';
                                case 'INVOKE_API_DEST_ROLE_ARN_NP':
                                    return 'arn:aws:iam::727026770742:role/EAI-EventBus-InvokeApiDestRole-DEV-NP';
                                case 'DDB_SUBSCRIPTIONS_TABLE_NAME':
                                    return 'EAI-EventApi-SubscriptionsTable-TEST';
                                case 'PUT_EVENT_BUS_DEST_ROLE_ARN':
                                    return 'arn:aws:iam::727026770742:role/EAI-EventBus-PutEventBusDestRole-DEV';
                                case 'PUT_EVENT_BUS_DEST_ROLE_ARN_NP':
                                    return 'arn:aws:iam::727026770742:role/EAI-EventBus-PutEventBusDestRole-DEV-NP';
                                default:
                                    throw new Error(`Unknown config value ${key}`);
                            }
                        }),
                    },
                },
                EventEmitter2,
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
                { provide: REQUEST, useValue: mockRequest },
                AwsService,
                SubscriptionsService,
                SubscriptionsInfrastructure,
                SubscriptionsRepository,
            ],
            controllers: [SubscriptionsController],
        }).compile();

        controller = module.get(SubscriptionsController);
        service = module.get(SubscriptionsService);

        ddbDocMock.reset();
        ebMock.reset();
    });

    describe('create()', () => {
        it('should return a subscription object if successfully created', async () => {
            // Arrange
            const mockResult: Subscription = {
                Name: 'subscription-test',
                RulePattern:
                    '{"source":["wel.corporate.peopleandglobalcapability"],"detail-type":["LeaveStatusChange"],"detail":{"Metadata":{"Version":["1"]}}}',
                Description: 'test rule',
                Targets: ['arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-NP'],
                CostCode: 'COST-CODE-01',
                AppName: 'app-test',
                AppCINumber: 'CITest01',
                SubscriptionOwner: 'Test',
                SubscribingDomain: 'wel.operations.maintenance',
                SchemaName: 'wel.corporate.peopleandglobalcapability@LeaveStatusChange',
                SchemaVersion: '1',
                OwnerRole: 'Event.User.SAP',
            };
            jest.spyOn(service, 'createSubscription').mockImplementation(async () => mockResult);
            const subscriptionDto: CreateSubscriptionDto = {
                SchemaName: 'wel.corporate.peopleandglobalcapability@LeaveStatusChange',
                SchemaVersion: '1',
                Description: 'test rule',
                Targets: ['arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-NP'],
                RulePattern:
                    '{"source":["wel.corporate.peopleandglobalcapability"],"detail-type":["LeaveStatusChange"],"detail":{"Metadata":{"Version":["1"]}}}',
                CostCode: 'COST-CODE-01',
                AppName: 'SAP',
                AppCINumber: 'CITest01',
                SubscriptionOwner: 'Test',
                SubscribingDomain: 'wel.operations.maintenance',
                OwnerRole: 'Event.User.SAP',
                Broker: BrokerTypes.NP,
            };

            // Act
            const response = await controller.create(subscriptionDto, mockRequest);
            // Assert
            expect(response).toEqual(mockResult);
        });

        it('should throw an error if exceptions are thrown', async () => {
            // Arrange
            const mockErrorMessage = 'test error message';
            jest.spyOn(service, 'createSubscription').mockImplementation(async () => {
                throw new Error(mockErrorMessage);
            });
            const subscriptionDto: CreateSubscriptionDto = {
                SchemaName: 'wel.corporate.peopleandglobalcapability@LeaveStatusChange',
                SchemaVersion: '1',
                Description: 'test rule',
                Targets: ['arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-NP'],
                RulePattern:
                    '{"source":["wel.corporate.peopleandglobalcapability"],"detail-type":["LeaveStatusChange"],"detail":{"Metadata":{"Version":["1"]}}}',
                CostCode: 'COST-CODE-01',
                AppName: 'SAP',
                AppCINumber: 'CITest01',
                SubscriptionOwner: 'Test',
                SubscribingDomain: 'wel.operations.maintenance',
                OwnerRole: 'Event.User.SAP',
                Broker: BrokerTypes.NP,
            };

            // Act
            try {
                await controller.create(subscriptionDto, mockRequest);
            } catch (error: any) {
                // Assert
                expect(error.message).toMatch(mockErrorMessage);
            }
        });
    });

    describe('update()', () => {
        it('should return a subscription object if successfully updated', async () => {
            // Arrange
            const subscriptionName = 'TestRuleName';
            const subscriptionDto: UpdateSubscriptionDto = {
                SchemaName: 'wel.corporate.peopleandglobalcapability@LeaveStatusChange',
                SchemaVersion: '1',
                Description: 'test rule',
                Targets: ['arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-NP'],
                RulePattern:
                    '{"source":["wel.corporate.peopleandglobalcapability"],"detail-type":["LeaveStatusChange"],"detail":{"Metadata":{"Version":["1"]}}}',
                CostCode: 'COST-CODE-01',
                AppName: 'SAP',
                AppCINumber: 'CITest01',
                SubscriptionOwner: 'Test',
                SubscribingDomain: 'wel.operations.maintenance',
                OwnerRole: 'Event.User.JIRA',
                Broker: BrokerTypes.NP,
                State: SubscriptionState.ENABLED,
            };
            const expectedResult: Subscription = {
                Name: subscriptionName,
                RulePattern:
                    '{"source":["wel.corporate.peopleandglobalcapability"],"detail-type":["LeaveStatusChange"],"detail":{"Metadata":{"Version":["1"]}}}',
                Description: 'test rule',
                Targets: ['arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-NP'],
                CostCode: 'COST-CODE-01',
                AppName: 'app-test',
                AppCINumber: 'CITest01',
                SubscriptionOwner: 'Test',
                SubscribingDomain: 'wel.operations.maintenance',
                SchemaName: 'wel.corporate.peopleandglobalcapability@LeaveStatusChange',
                SchemaVersion: '1',
                OwnerRole: 'Event.User.JIRA',
            };
            jest.spyOn(service, 'getSubscription').mockImplementation(async () => {
                return {
                    Name: subscriptionName,
                    RulePattern:
                        '{"source":["wel.corporate.peopleandglobalcapability"],"detail-type":["LeaveStatusChange"],"detail":{"Metadata":{"Version":["1"]}}}',
                    Description: 'test rule',
                    Targets: ['arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-NP'],
                    CostCode: 'COST-CODE-01',
                    AppName: 'app-test',
                    AppCINumber: 'CITest01',
                    SubscriptionOwner: 'Test',
                    SubscribingDomain: 'wel.operations.maintenance',
                    SchemaName: 'wel.corporate.peopleandglobalcapability@LeaveStatusChange',
                    SchemaVersion: '1',
                    OwnerRole: 'Event.User.JIRA',
                };
            });
            jest.spyOn(service, 'updateSubscription').mockImplementation(async () => expectedResult);

            // Act
            const response = await controller.update(subscriptionName, subscriptionDto, mockRequest);
            // Assert
            expect(response).toEqual(expectedResult);
        });

        it('should throw a UnauthorizedException if user is not allowed to edit subscription', async () => {
            // Arrange
            jest.spyOn(service, 'getSubscription').mockImplementation(async () => {
                return {
                    Name: 'subscription-test',
                    RulePattern:
                        '{"source":["wel.corporate.peopleandglobalcapability"],"detail-type":["LeaveStatusChange"],"detail":{"Metadata":{"Version":["1"]}}}',
                    Description: 'test rule',
                    Targets: ['arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-NP'],
                    CostCode: 'COST-CODE-01',
                    AppName: 'app-test',
                    AppCINumber: 'CITest01',
                    SubscriptionOwner: 'Test',
                    SubscribingDomain: 'wel.operations.maintenance',
                    SchemaName: 'wel.corporate.peopleandglobalcapability@LeaveStatusChange',
                    SchemaVersion: '1',
                    OwnerRole: 'Event.User.SAP',
                };
            });
            const name = 'subscription-test';
            const subscriptionDto: UpdateSubscriptionDto = {
                SchemaName: 'wel.corporate.peopleandglobalcapability@LeaveStatusChange',
                SchemaVersion: '1',
                Description: 'test rule',
                Targets: ['arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-NP'],
                RulePattern:
                    '{"source":["wel.corporate.peopleandglobalcapability"],"detail-type":["LeaveStatusChange"],"detail":{"Metadata":{"Version":["1"]}}}',
                CostCode: 'COST-CODE-01',
                AppName: 'SAP',
                AppCINumber: 'CITest01',
                SubscriptionOwner: 'Test',
                SubscribingDomain: 'wel.operations.maintenance',
                OwnerRole: 'Event.User.SAP',
                Broker: BrokerTypes.NP,
                State: SubscriptionState.ENABLED,
            };

            try {
                // Act
                await controller.update(name, subscriptionDto, mockRequest);
            } catch (error: any) {
                // Assert
                expect(error).toBeInstanceOf(UnauthorizedException);
                expect(error.message).toMatch(`User not allowed to edit ${name}`);
            }
        });
    });

    describe('listSubscriptions()', () => {
        it('can return all rules in an EventBus with no filter', async () => {
            // Output
            const mockResult: Subscription[] = [
                {
                    SchemaVersion: '1',
                    AppCINumber: '456',
                    Targets: ['arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-NP'],
                    SubscriptionOwner: 'Test',
                    SubscribingDomain: 'wel.operations.maintenance',
                    Description: 'Subscribe to events',
                    State: SubscriptionState.ENABLED,
                    AppName: 'SAP',
                    OwnerRole: 'Event.User.SAP',
                    RulePattern: '{"source":["wel.operations.maintenance"], "detail-type": ["WorkOrderStatusChange"]}',
                    Broker: BrokerTypes.NP,
                    SchemaName: 'wel.operations.maintenance@Test',
                    CostCode: '123',
                    Name: 'SAP.maintenance.Test.0xbvs',
                },
                {
                    SchemaVersion: '1',
                    AppCINumber: '456',
                    Targets: ['arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-NP'],
                    SubscriptionOwner: 'Test',
                    SubscribingDomain: 'wel.operations.maintenance',
                    Description: 'Subscribe to events',
                    State: SubscriptionState.ENABLED,
                    AppName: 'SAP',
                    OwnerRole: 'Event.User.SAP',
                    RulePattern: '{"source":["wel.operations.maintenance"], "detail-type": ["WorkOrderStatusChange"]}',
                    Broker: BrokerTypes.NP,
                    SchemaName: 'wel.operations.maintenance@Test',
                    CostCode: '123',
                    Name: 'SAP.maintenance.Test.0yc3i',
                },
            ];
            jest.spyOn(service, 'getSubscriptions').mockImplementation(async () => mockResult);

            // Act
            const response = await controller.listSubscriptions();

            // Assert
            expect(response).toEqual(mockResult);
        });

        it('get Subscriptions can return an error if exceptions are thrown', async () => {
            // Output
            const mockErrorMessage = 'test error message';
            jest.spyOn(service, 'getSubscriptions').mockImplementation(async () => {
                throw new Error(mockErrorMessage);
            });
            // Act
            try {
                await controller.listSubscriptions();
            } catch (error: any) {
                // Assert
                expect(error.message).toMatch(mockErrorMessage);
            }
        });
    });

    describe('delete()', () => {
        it('should return a subscription object if successfully deleted', async () => {
            // Arrange
            const subscriptionName = 'DeleteRuleName';

            const expectedResult: Subscription = {
                Name: subscriptionName,
                RulePattern:
                    '{"source":["wel.corporate.peopleandglobalcapability"],"detail-type":["LeaveStatusChange"],"detail":{"Metadata":{"Version":["1"]}}}',
                Description: 'deleted',
                Targets: ['arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-NP'],
                CostCode: 'COST-CODE-01',
                AppName: 'app-test',
                AppCINumber: 'CITest01',
                SubscriptionOwner: 'Test',
                SubscribingDomain: 'wel.operations.maintenance',
                SchemaName: 'wel.corporate.peopleandglobalcapability@LeaveStatusChange',
                SchemaVersion: '1',
                OwnerRole: 'Event.User.JIRA',
            };
            jest.spyOn(service, 'getSubscription').mockImplementation(async () => {
                return {
                    Name: subscriptionName,
                    RulePattern:
                        '{"source":["wel.corporate.peopleandglobalcapability"],"detail-type":["LeaveStatusChange"],"detail":{"Metadata":{"Version":["1"]}}}',
                    Description: 'deleted',
                    Targets: ['arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-NP'],
                    CostCode: 'COST-CODE-01',
                    AppName: 'app-test',
                    AppCINumber: 'CITest01',
                    SubscriptionOwner: 'Test',
                    SubscribingDomain: 'wel.operations.maintenance',
                    SchemaName: 'wel.corporate.peopleandglobalcapability@LeaveStatusChange',
                    SchemaVersion: '1',
                    OwnerRole: 'Event.User.JIRA',
                };
            });
            jest.spyOn(service, 'delete').mockImplementation(async () => expectedResult);

            // Act
            const response = await controller.delete(subscriptionName, mockRequest);
            // Assert
            expect(response).toEqual(expectedResult);
        });

        it('should throw a UnauthorizedException if user is not allowed to delete subscription', async () => {
            // Arrange
            const subscriptionName = 'DeleteRuleName';

            const expectedResult: Subscription = {
                Name: subscriptionName,
                RulePattern:
                    '{"source":["wel.corporate.peopleandglobalcapability"],"detail-type":["LeaveStatusChange"],"detail":{"Metadata":{"Version":["1"]}}}',
                Description: 'deleted',
                Targets: ['arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-NP'],
                CostCode: 'COST-CODE-01',
                AppName: 'app-test',
                AppCINumber: 'CITest01',
                SubscriptionOwner: 'Test',
                SubscribingDomain: 'wel.operations.maintenance',
                SchemaName: 'wel.corporate.peopleandglobalcapability@LeaveStatusChange',
                SchemaVersion: '1',
                OwnerRole: 'Event.User.SAP', //mismatching OwnerRole
            };

            jest.spyOn(service, 'getSubscription').mockImplementation(async () => expectedResult);

            try {
                // Act
                await controller.delete(subscriptionName, mockRequest);
            } catch (error: any) {
                // Assert
                expect(error).toBeInstanceOf(UnauthorizedException);
                expect(error.message).toMatch(`User not allowed to delete ${subscriptionName}`);
            }
        });

        it('should throw a generic error when a generic error raised', async () => {
            // Output
            const subscriptionName = 'DeleteRuleName';
            const mockErrorMessage = 'test error message';
            jest.spyOn(service, 'getSubscription').mockImplementation(async () => {
                throw new Error(mockErrorMessage);
            });

            try {
                // Act
                await controller.delete(subscriptionName, mockRequest);
            } catch (error: any) {
                // Assert
                expect(error.message).toMatch(mockErrorMessage);
            }
        });
    });
});
