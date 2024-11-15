import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import {
    EventBridge,
    EventBridgeServiceException,
    PutRuleCommand,
    PutTargetsCommand,
    RemoveTargetsCommand,
} from '@aws-sdk/client-eventbridge';
import { mockClient } from 'aws-sdk-client-mock';
import { BrokerTypes, Subscription, SubscriptionState } from '@eai-event-integration-platform/interfaces';
import { SubscriptionsInfrastructure } from './subscriptions.infrastructure';

const ebMock = mockClient(EventBridge);

describe('SubscriptionsInfrastructure', () => {
    let service: SubscriptionsInfrastructure;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                {
                    provide: ConfigService,
                    useValue: {
                        getOrThrow: jest.fn((key: string) => {
                            switch (key) {
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
                {
                    provide: EventBridge,
                    useFactory: async () => new EventBridge({ region: 'ap-southeast-2' }),
                },
                SubscriptionsInfrastructure,
            ],
        }).compile();

        service = module.get<SubscriptionsInfrastructure>(SubscriptionsInfrastructure);

        ebMock.reset();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('saveRule', () => {
        it('should return a RuleArn on successful putRule', async () => {
            // Arrange
            const subscription: Subscription = {
                Name: 'TestRuleName',
                Description: 'Test Rule Description',
                RulePattern: '{}',
                EventBusName: 'EAI-EventBus-TEST',
                State: SubscriptionState.ENABLED,
            };
            ebMock.on(PutRuleCommand).resolves({
                $metadata: { httpStatusCode: 200 },
                RuleArn: `arn:aws:events:ap-southeast-2:727026770742:rule/${subscription.EventBusName}/${subscription.Name}`,
            });

            // Act
            const result = await service.saveRule(subscription);

            // Assert
            expect(result).toEqual(
                `arn:aws:events:ap-southeast-2:727026770742:rule/${subscription.EventBusName}/${subscription.Name}`,
            );
        });
        it('should throw a BadRequest error for invalid rule pattern', async () => {
            // Arrange
            const subscription: Subscription = {
                Name: 'TestRuleName',
                Description: 'Test Rule Description',
                RulePattern: '{}',
                EventBusName: 'EAI-EventBus-DEV',
                State: SubscriptionState.ENABLED,
            };
            // ebMock.on(PutRuleCommand).rejects(new InvalidEventPatternException({ $metadata: { httpStatusCode: 400 } }));
            ebMock.on(PutRuleCommand).rejects(
                new EventBridgeServiceException({
                    $fault: 'client',
                    $metadata: { httpStatusCode: 400 },
                    name: 'InvalidEventPatternException',
                }),
            );

            try {
                // Act
                await service.saveRule(subscription);
            } catch (error) {
                // Assert
                expect(error).toBeInstanceOf(BadRequestException);
            }
        });
        it('should throw a InternalServerErrorException error for other errors', async () => {
            // Arrange
            const subscription: Subscription = {
                Name: 'TestRuleName',
                Description: 'Test Rule Description',
                RulePattern: '{}',
                EventBusName: 'EAI-EventBus-DEV',
                State: SubscriptionState.ENABLED,
            };
            ebMock.on(PutRuleCommand).rejects(
                new EventBridgeServiceException({
                    $fault: 'server',
                    $metadata: { httpStatusCode: 500 },
                    name: 'InternalException',
                }),
            );

            try {
                // Act
                await service.saveRule(subscription);
            } catch (error) {
                // Assert
                expect(error).toBeInstanceOf(InternalServerErrorException);
            }
        });
    });

    describe('addTargets', () => {
        it('should save and return all targets for NP', async () => {
            // Arrange
            const targetArns = [
                'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-NP1',
                'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-NP2',
            ];
            ebMock.on(PutTargetsCommand).resolves({ $metadata: { httpStatusCode: 200 }, FailedEntryCount: 0 });

            // Act
            const result = await service.addTargets(targetArns, 'TestRuleName', 'TestEventBusName', BrokerTypes.NP);

            // Assert
            expect(result).toHaveLength(targetArns.length);
        });
        it('should save and return a single targets for PRD', async () => {
            // Arrange
            const targetArns = [
                'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-NP1',
                'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-SubscriberTestEventBus-NP2',
            ];
            ebMock.on(PutTargetsCommand).resolves({ $metadata: { httpStatusCode: 200 }, FailedEntryCount: 0 });

            // Act
            const result = await service.addTargets(targetArns, 'TestRuleName', 'TestEventBusName', BrokerTypes.PRD);

            // Assert
            expect(result).toHaveLength(1);
        });
    });

    describe('removeTarget', () => {
        it('should not throw errors for valid requests', async () => {
            // Arrange
            ebMock.on(RemoveTargetsCommand).resolves({
                $metadata: { httpStatusCode: 200 },
            });

            // Act
            const promise = service.removeTargets('TestRule', 'EAI-EventBus-DEV', ['id1', 'id2']);

            // Assert
            expect(promise).resolves.not.toThrowError();
        });
        it('should throw a BadRequestException error for invalid requests', async () => {
            // Arrange
            ebMock.on(RemoveTargetsCommand).rejects(
                new EventBridgeServiceException({
                    $metadata: { httpStatusCode: 400 },
                    $fault: 'client',
                    name: 'ValidationException',
                }),
            );

            try {
                // Act
                await service.removeTargets('TestRule', 'EAI-EventBus-DEV', ['id1', 'id2']);
            } catch (error) {
                // Assert
                expect(error).toBeInstanceOf(BadRequestException);
            }
        });
        it('should throw a NotFoundException error for invalid resource', async () => {
            // Arrange
            ebMock.on(RemoveTargetsCommand).rejects(
                new EventBridgeServiceException({
                    $metadata: { httpStatusCode: 400 },
                    $fault: 'client',
                    name: 'ResourceNotFoundException',
                }),
            );

            try {
                // Act
                await service.removeTargets('TestRule', 'EAI-EventBus-DEV', ['id1', 'id2']);
            } catch (error) {
                // Assert
                expect(error).toBeInstanceOf(NotFoundException);
            }
        });
        it('should throw a InternalServerErrorException error for default error', async () => {
            // Arrange
            ebMock.on(RemoveTargetsCommand).rejects(
                new EventBridgeServiceException({
                    $metadata: { httpStatusCode: 400 },
                    $fault: 'client',
                    name: 'OtherException',
                }),
            );

            try {
                // Act
                await service.removeTargets('TestRule', 'EAI-EventBus-DEV', ['id1', 'id2']);
            } catch (error) {
                // Assert
                expect(error).toBeInstanceOf(InternalServerErrorException);
            }
        });
    });
});
