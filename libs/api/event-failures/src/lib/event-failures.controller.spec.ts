import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { STS } from '@aws-sdk/client-sts';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { AwsService } from '@eai-event-integration-platform/api/aws';
import { BrokerTypes, PagedFailureMessage } from '@eai-event-integration-platform/interfaces';

import { EventFailuresController } from './event-failures.controller';
import { EventFailuresRepository } from './event-failures.repository';
import { EventFailuresService } from './event-failures.service';

describe('EventFailuresController', () => {
    let controller: EventFailuresController;
    let service: EventFailuresService;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                {
                    provide: ConfigService,
                    useValue: {
                        getOrThrow: jest.fn((key: string) => {
                            return '';
                        }),
                    },
                },
                AwsService,
                EventFailuresService,
                EventFailuresRepository,
                { provide: STS, useFactory: async () => new STS({ region: 'ap-southeast-2' }) },
                {
                    provide: DynamoDBDocument,
                    useFactory: async () => DynamoDBDocument.from(new DynamoDB({ region: 'ap-southeast-2' })),
                },
            ],
            controllers: [EventFailuresController],
        }).compile();

        controller = module.get(EventFailuresController);
        service = await module.resolve(EventFailuresService);
    });

    it('should be defined', () => {
        expect(controller).toBeTruthy();
    });

    describe('listEventFailures()', () => {
        it('can listEventFailures() without offset keys', async () => {
            // Arrange
            const mockResult = {
                Data: [
                    {
                        SubscriberApp: 'JIRA',
                        ErrorMessage: 'Lack of permissions to invoke cross account target.',
                        RuleArn:
                            'arn:aws:events:ap-southeast-2:727026770742:rule/EAI-EventBus-AS-NP/AS-test-Eventbridege-rule',
                        MessageId: '29ee3bfb-0ca3-4c2a-aab2-632b8428643d',
                        TTL: 1666855114,
                        SentTimestamp: '2022-10-27T07:18:34.261Z',
                        ErrorCode: 'NO_PERMISSIONS',
                        Body: '{"version":"0","id":"3de625b9-148c-dbad-647e-64dd792f0081","detail-type":"wel.test","source":"wel.test","account":"727026770742","time":"2022-10-27T05:39:01Z","region":"ap-southeast-2","resources":[],"detail":{"Metadata":{"Guid":"2022-SAR-00116|approver|jayanta.das@dev.woodside.com.au|test","Time":1661327407424,"Version":"1","Action":"add","Producer":"SAP"},"Data":{"UserId":"XW54177","CreationDate":"2022-08-24T07:50:06.813Z","DisplayName":"Site Access Request Form - test","DueDate":"2022-08-27T07:49:28.000Z","Email":"jayanta.das@dev.woodside.com.au","Id":"2022-SAR-00116|approver|jayanta.das@dev.woodside.com.au|test","SourceUrl":"http://sar-test.dev.app.woodside/myworklist/2022-SAR-00116/approval","TaskType":"Site Access Request Form - Pending Approval","Category":"SAR","Title":"Site Access Request – Approval Required for Form 2022-SAR-00116 - for Saha, Jit (TATA CONSULTANCY SERVICES LTD), for Location KGP and Mobilisation Date: 27/08/2022"}}}',
                        TargetArn: 'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-AS-TEST-BUS-1',
                        EventTimestamp: '2022-08-24T07:50:06.813Z',
                        EventId: '3de625b9-148c-dbad-647e-64dd792f0081',
                        Attributes: {
                            ApproximateFirstReceiveTimestamp: '1666855114544',
                            SenderId: 'AIDAIDYJ7RPI7CT46XWPK',
                            ApproximateReceiveCount: '1',
                        },
                        SourceArn: 'arn:aws:sqs:ap-southeast-2:727026770742:EAI-EventBus-TargetDLQ-AS-NP',
                        RetryAttempts: 1,
                        SubscriptionId: 'IDMS.maintenance.FunctionalLocationCreated.9q0p4',
                    },
                    {
                        SubscriberApp: 'JIRA',
                        ErrorMessage: 'Lack of permissions to invoke cross account target.',
                        RuleArn:
                            'arn:aws:events:ap-southeast-2:727026770742:rule/EAI-EventBus-AS-NP/AS-test-Eventbridege-rule',
                        MessageId: '3e43bb56-2c31-4383-a228-6d129e753745',
                        TTL: 1666853219,
                        SentTimestamp: '2022-10-27T06:46:59.162Z',
                        ErrorCode: 'NO_PERMISSIONS',
                        Body: '{"version":"0","id":"b1011fcb-5743-d5de-f8b7-3674ba8bdb02","detail-type":"wel.test","source":"wel.test","account":"727026770742","time":"2022-10-27T05:39:01Z","region":"ap-southeast-2","resources":[],"detail":{"Metadata":{"Guid":"2022-SAR-00116|approver|jayanta.das@dev.woodside.com.au|test","Time":1661327407424,"Version":"1","Action":"add","Producer":"SAP"},"Data":{"UserId":"XW54177","CreationDate":"2022-08-24T07:50:06.813Z","DisplayName":"Site Access Request Form - test","DueDate":"2022-08-27T07:49:28.000Z","Email":"jayanta.das@dev.woodside.com.au","Id":"2022-SAR-00116|approver|jayanta.das@dev.woodside.com.au|test","SourceUrl":"http://sar-test.dev.app.woodside/myworklist/2022-SAR-00116/approval","TaskType":"Site Access Request Form - Pending Approval","Category":"SAR","Title":"Site Access Request – Approval Required for Form 2022-SAR-00116 - for Saha, Jit (TATA CONSULTANCY SERVICES LTD), for Location KGP and Mobilisation Date: 27/08/2022"}}}',
                        TargetArn: 'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-AS-TEST-BUS',
                        EventTimestamp: '2022-08-24T07:50:06.813Z',
                        EventId: 'b1011fcb-5743-d5de-f8b7-3674ba8bdb02',
                        Attributes: {
                            ApproximateFirstReceiveTimestamp: '1666853219167',
                            SenderId: 'AIDAIDYJ7RPI7CT46XWPK',
                            ApproximateReceiveCount: '1',
                        },
                        SourceArn: 'arn:aws:sqs:ap-southeast-2:727026770742:EAI-EventBus-TargetDLQ-AS-NP',
                        RetryAttempts: 1,
                        SubscriptionId: 'IDMS.maintenance.FunctionalLocationChanged.fj8kn',
                    },
                ],
                Offset: {
                    PK: 'ERR#AS-test-Eventbridege-rule#EAI-AS-TEST-BUS',
                    SK: '#2022-10-27T06:46:59.162Z',
                },
            };

            jest.spyOn(service, 'listEventFailures').mockImplementation(async () => mockResult);

            //Act
            const response = await controller.listEventFailures(BrokerTypes.NP, 'JIRA', 5);

            // Assert
            expect(response).toEqual(mockResult);
        });

        it('can listEventFailures() with offset keys', async () => {
            // Arrange
            const mockResult: PagedFailureMessage = {
                Data: [
                    {
                        SubscriberApp: 'JIRA',
                        ErrorMessage: 'Lack of permissions to invoke cross account target.',
                        RuleArn:
                            'arn:aws:events:ap-southeast-2:727026770742:rule/EAI-EventBus-AS-NP/AS-test-Eventbridege-rule',
                        MessageId: '29ee3bfb-0ca3-4c2a-aab2-632b8428643d',
                        TTL: 1666855114,
                        SentTimestamp: '2022-10-27T07:18:34.261Z',
                        ErrorCode: 'NO_PERMISSIONS',
                        Body: '{"version":"0","id":"3de625b9-148c-dbad-647e-64dd792f0081","detail-type":"wel.test","source":"wel.test","account":"727026770742","time":"2022-10-27T05:39:01Z","region":"ap-southeast-2","resources":[],"detail":{"Metadata":{"Guid":"2022-SAR-00116|approver|jayanta.das@dev.woodside.com.au|test","Time":1661327407424,"Version":"1","Action":"add","Producer":"SAP"},"Data":{"UserId":"XW54177","CreationDate":"2022-08-24T07:50:06.813Z","DisplayName":"Site Access Request Form - test","DueDate":"2022-08-27T07:49:28.000Z","Email":"jayanta.das@dev.woodside.com.au","Id":"2022-SAR-00116|approver|jayanta.das@dev.woodside.com.au|test","SourceUrl":"http://sar-test.dev.app.woodside/myworklist/2022-SAR-00116/approval","TaskType":"Site Access Request Form - Pending Approval","Category":"SAR","Title":"Site Access Request – Approval Required for Form 2022-SAR-00116 - for Saha, Jit (TATA CONSULTANCY SERVICES LTD), for Location KGP and Mobilisation Date: 27/08/2022"}}}',
                        TargetArn: 'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-AS-TEST-BUS-1',
                        EventTimestamp: '2022-08-24T07:50:06.813Z',
                        EventId: '3de625b9-148c-dbad-647e-64dd792f0081',
                        Attributes: {
                            ApproximateFirstReceiveTimestamp: '1666855114544',
                            SenderId: 'AIDAIDYJ7RPI7CT46XWPK',
                            ApproximateReceiveCount: '1',
                        },
                        SourceArn: 'arn:aws:sqs:ap-southeast-2:727026770742:EAI-EventBus-TargetDLQ-AS-NP',
                        RetryAttempts: 1,
                        SubscriptionId: 'IDMS.maintenance.FunctionalLocationCreated.9q0p4',
                    },
                    {
                        SubscriberApp: 'JIRA',
                        ErrorMessage: 'Lack of permissions to invoke cross account target.',
                        RuleArn:
                            'arn:aws:events:ap-southeast-2:727026770742:rule/EAI-EventBus-AS-NP/AS-test-Eventbridege-rule',
                        MessageId: '3e43bb56-2c31-4383-a228-6d129e753745',
                        TTL: 1666853219,
                        SentTimestamp: '2022-10-27T06:46:59.162Z',
                        ErrorCode: 'NO_PERMISSIONS',
                        Body: '{"version":"0","id":"b1011fcb-5743-d5de-f8b7-3674ba8bdb02","detail-type":"wel.test","source":"wel.test","account":"727026770742","time":"2022-10-27T05:39:01Z","region":"ap-southeast-2","resources":[],"detail":{"Metadata":{"Guid":"2022-SAR-00116|approver|jayanta.das@dev.woodside.com.au|test","Time":1661327407424,"Version":"1","Action":"add","Producer":"SAP"},"Data":{"UserId":"XW54177","CreationDate":"2022-08-24T07:50:06.813Z","DisplayName":"Site Access Request Form - test","DueDate":"2022-08-27T07:49:28.000Z","Email":"jayanta.das@dev.woodside.com.au","Id":"2022-SAR-00116|approver|jayanta.das@dev.woodside.com.au|test","SourceUrl":"http://sar-test.dev.app.woodside/myworklist/2022-SAR-00116/approval","TaskType":"Site Access Request Form - Pending Approval","Category":"SAR","Title":"Site Access Request – Approval Required for Form 2022-SAR-00116 - for Saha, Jit (TATA CONSULTANCY SERVICES LTD), for Location KGP and Mobilisation Date: 27/08/2022"}}}',
                        TargetArn: 'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-AS-TEST-BUS',
                        EventTimestamp: '2022-08-24T07:50:06.813Z',
                        EventId: 'b1011fcb-5743-d5de-f8b7-3674ba8bdb02',
                        Attributes: {
                            ApproximateFirstReceiveTimestamp: '1666853219167',
                            SenderId: 'AIDAIDYJ7RPI7CT46XWPK',
                            ApproximateReceiveCount: '1',
                        },
                        SourceArn: 'arn:aws:sqs:ap-southeast-2:727026770742:EAI-EventBus-TargetDLQ-AS-NP',
                        RetryAttempts: 1,
                        SubscriptionId: 'IDMS.maintenance.FunctionalLocationChanged.fj8kn',
                    },
                ],
                Offset: {
                    PK: 'ERR#AS-test-Eventbridege-rule#EAI-AS-TEST-BUS',
                    SK: '#2022-10-27T06:46:59.162Z',
                },
            };

            const mockResultWithOffset = {
                Data: [
                    {
                        SubscriberApp: 'JIRA',
                        ErrorMessage: 'Lack of permissions to invoke cross account target.',
                        RuleArn:
                            'arn:aws:events:ap-southeast-2:727026770742:rule/EAI-EventBus-AS-NP/AS-test-Eventbridege-rule',
                        MessageId: '1413f1a6-127d-4465-9be9-e626bf2bae4a',
                        TTL: 1666853219,
                        SentTimestamp: '2022-10-27T06:46:59.165Z',
                        ErrorCode: 'NO_PERMISSIONS',
                        Body: '{"version":"0","id":"b1011fcb-5743-d5de-f8b7-3674ba8bdb02","detail-type":"wel.test","source":"wel.test","account":"727026770742","time":"2022-10-27T05:39:01Z","region":"ap-southeast-2","resources":[],"detail":{"Metadata":{"Guid":"2022-SAR-00116|approver|jayanta.das@dev.woodside.com.au|test","Time":1661327407424,"Version":"1","Action":"add","Producer":"SAP"},"Data":{"UserId":"XW54177","CreationDate":"2022-08-24T07:50:06.813Z","DisplayName":"Site Access Request Form - test","DueDate":"2022-08-27T07:49:28.000Z","Email":"jayanta.das@dev.woodside.com.au","Id":"2022-SAR-00116|approver|jayanta.das@dev.woodside.com.au|test","SourceUrl":"http://sar-test.dev.app.woodside/myworklist/2022-SAR-00116/approval","TaskType":"Site Access Request Form - Pending Approval","Category":"SAR","Title":"Site Access Request – Approval Required for Form 2022-SAR-00116 - for Saha, Jit (TATA CONSULTANCY SERVICES LTD), for Location KGP and Mobilisation Date: 27/08/2022"}}}',
                        TargetArn: 'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-AS-TEST-BUS-1',
                        EventTimestamp: '2022-08-24T07:50:06.813Z',
                        EventId: 'b1011fcb-5743-d5de-f8b7-3674ba8bdb02',
                        Attributes: {
                            ApproximateFirstReceiveTimestamp: '1666853219166',
                            SenderId: 'AIDAIDYJ7RPI7CT46XWPK',
                            ApproximateReceiveCount: '1',
                        },
                        SourceArn: 'arn:aws:sqs:ap-southeast-2:727026770742:EAI-EventBus-TargetDLQ-AS-NP',
                        RetryAttempts: 1,
                        SubscriptionId: 'IDMS.maintenance.FunctionalLocationCreated.9q0p4',
                    },
                    {
                        SubscriberApp: 'JIRA',
                        ErrorMessage: 'Lack of permissions to invoke cross account target.',
                        RuleArn:
                            'arn:aws:events:ap-southeast-2:727026770742:rule/EAI-EventBus-AS-NP/AS-test-Eventbridege-rule',
                        MessageId: '05d37a32-1cff-4c6e-a77e-6fb19eaa17e0',
                        TTL: 1666853219,
                        SentTimestamp: '2022-10-27T06:46:59.676Z',
                        ErrorCode: 'NO_PERMISSIONS',
                        Body: '{"version":"0","id":"44ad8190-48be-c21e-fa4d-b728c679848b","detail-type":"wel.test","source":"wel.test","account":"727026770742","time":"2022-10-27T05:39:01Z","region":"ap-southeast-2","resources":[],"detail":{"Metadata":{"Guid":"2022-SAR-00116|approver|jayanta.das@dev.woodside.com.au|test","Time":1661327407424,"Version":"1","Action":"add","Producer":"SAP"},"Data":{"UserId":"XW54177","CreationDate":"2022-08-24T07:50:06.813Z","DisplayName":"Site Access Request Form - test","DueDate":"2022-08-27T07:49:28.000Z","Email":"jayanta.das@dev.woodside.com.au","Id":"2022-SAR-00116|approver|jayanta.das@dev.woodside.com.au|test","SourceUrl":"http://sar-test.dev.app.woodside/myworklist/2022-SAR-00116/approval","TaskType":"Site Access Request Form - Pending Approval","Category":"SAR","Title":"Site Access Request – Approval Required for Form 2022-SAR-00116 - for Saha, Jit (TATA CONSULTANCY SERVICES LTD), for Location KGP and Mobilisation Date: 27/08/2022"}}}',
                        TargetArn: 'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-AS-TEST-BUS-1',
                        EventTimestamp: '2022-08-24T07:50:06.813Z',
                        EventId: '44ad8190-48be-c21e-fa4d-b728c679848b',
                        Attributes: {
                            ApproximateFirstReceiveTimestamp: '1666853219678',
                            SenderId: 'AIDAIDYJ7RPI7CT46XWPK',
                            ApproximateReceiveCount: '1',
                        },
                        SourceArn: 'arn:aws:sqs:ap-southeast-2:727026770742:EAI-EventBus-TargetDLQ-AS-NP',
                        RetryAttempts: 1,
                        SubscriptionId: 'IDMS.maintenance.FunctionalLocationChanged.fj8kn',
                    },
                ],
                Offset: {
                    PK: 'ERR#AS-test-Eventbridege-rule#EAI-AS-TEST-BUS-1',
                    SK: '#2022-10-27T06:46:59.676Z',
                },
            };
            jest.spyOn(service, 'listEventFailures').mockImplementationOnce(async () => mockResult);
            jest.spyOn(service, 'listEventFailures').mockImplementationOnce(async () => mockResultWithOffset);

            //Act

            const response = await controller.listEventFailures(BrokerTypes.NP, 'JIRA', 5);
            const offset = `${response!.Offset!.PK}#${response!.Offset!.SK}`;
            const responseWithOffset = await controller.listEventFailures(BrokerTypes.NP, 'JIRA', 5, offset);

            // Assert
            expect(response).toEqual(mockResult);
            expect(responseWithOffset).toEqual(mockResultWithOffset);
        });

        it('can listEventFailures() with filters using subscriptionId', async () => {
            // Arrange
            const mockResult: PagedFailureMessage = {
                Data: [
                    {
                        SubscriberApp: 'JIRA',
                        ErrorMessage: 'Lack of permissions to invoke cross account target.',
                        RuleArn: 'arn:aws:events:ap-southeast-2:727026770742:rule/EAI-EventBus-AS-NP/AS-test.klmx',
                        MessageId: 'caf52ebe-3170-4143-bda6-ea0d8654c3db',
                        TTL: 1667984118,
                        SentTimestamp: '2022-11-09T08:55:18.301Z',
                        ErrorCode: 'NO_PERMISSIONS',
                        Body: '{"version":"0","id":"7d0827b8-dca3-5119-84e6-132adec4eaf2","detail-type":"Event","source":"wel.climate-strategy.carbon","account":"727026770742","time":"2022-11-09T08:45:44Z","region":"ap-southeast-2","resources":[],"detail":{"Metadata":{"Guid":"2022-SAR-00116|approver|jayanta.das@dev.woodside.com.au|test","Time":1661327407424,"Version":"1","Action":"add","Producer":"TEST PRODUCER Failure events"},"Data":{"UserId":"XW54177","CreationDate":"2022-08-24T07:50:06.813Z","DisplayName":"Site Access Request Form - test","DueDate":"2022-08-27T07:49:28.000Z","Email":"jayanta.das@dev.woodside.com.au","Id":"2022-SAR-00116|approver|jayanta.das@dev.woodside.com.au|test","SourceUrl":"http://sar-test.dev.app.woodside/myworklist/2022-SAR-00116/approval","TaskType":"Site Access Request Form - Pending Approval","Category":"SAR","Title":"Site Access Request – Approval Required for Form 2022-SAR-00116 - for Saha, Jit (TATA CONSULTANCY SERVICES LTD), for Location KGP and Mobilisation Date: 27/08/2022"}}}',
                        TargetArn: 'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-AS-TEST-BUS-1',
                        EventTimestamp: '2022-08-24T07:50:06.813Z',
                        EventId: '7d0827b8-dca3-5119-84e6-132adec4eaf2',
                        Attributes: {
                            SenderId: 'AIDAIDYJ7RPI7CT46XWPK',
                            ApproximateReceiveCount: '1',
                            ApproximateFirstReceiveTimestamp: '1667984118302',
                        },
                        SourceArn: 'arn:aws:sqs:ap-southeast-2:727026770742:EAI-EventBus-TargetDLQ-AS-NP',
                        RetryAttempts: 1,
                        SubscriptionId: 'IDMS.maintenance.FunctionalLocationCreated.9q0p4',
                    },
                    {
                        SubscriberApp: 'JIRA',
                        ErrorMessage: 'Lack of permissions to invoke cross account target.',
                        RuleArn: 'arn:aws:events:ap-southeast-2:727026770742:rule/EAI-EventBus-AS-NP/AS-test.klmx',
                        MessageId: '33ff511b-fc82-4a8a-90a0-2c3c6cfd6c95',
                        TTL: 1667984120,
                        SentTimestamp: '2022-11-09T08:55:20.480Z',
                        ErrorCode: 'NO_PERMISSIONS',
                        Body: '{"version":"0","id":"fdd2f3d3-ad0b-8d90-b4fa-d78d6007045a","detail-type":"Event","source":"wel.climate-strategy.carbon","account":"727026770742","time":"2022-11-09T08:45:44Z","region":"ap-southeast-2","resources":[],"detail":{"Metadata":{"Guid":"2022-SAR-00116|approver|jayanta.das@dev.woodside.com.au|test","Time":1661327407424,"Version":"1","Action":"add","Producer":"TEST PRODUCER Failure events"},"Data":{"UserId":"XW54177","CreationDate":"2022-08-24T07:50:06.813Z","DisplayName":"Site Access Request Form - test","DueDate":"2022-08-27T07:49:28.000Z","Email":"jayanta.das@dev.woodside.com.au","Id":"2022-SAR-00116|approver|jayanta.das@dev.woodside.com.au|test","SourceUrl":"http://sar-test.dev.app.woodside/myworklist/2022-SAR-00116/approval","TaskType":"Site Access Request Form - Pending Approval","Category":"SAR","Title":"Site Access Request – Approval Required for Form 2022-SAR-00116 - for Saha, Jit (TATA CONSULTANCY SERVICES LTD), for Location KGP and Mobilisation Date: 27/08/2022"}}}',
                        TargetArn: 'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-AS-TEST-BUS-1',
                        EventTimestamp: '2022-08-24T07:50:06.813Z',
                        EventId: 'fdd2f3d3-ad0b-8d90-b4fa-d78d6007045a',
                        Attributes: {
                            SenderId: 'AIDAIDYJ7RPI7CT46XWPK',
                            ApproximateReceiveCount: '1',
                            ApproximateFirstReceiveTimestamp: '1667984120481',
                        },
                        SourceArn: 'arn:aws:sqs:ap-southeast-2:727026770742:EAI-EventBus-TargetDLQ-AS-NP',
                        RetryAttempts: 1,
                        SubscriptionId: 'IDMS.maintenance.FunctionalLocationChanged.fj8kn',
                    },
                ],
            };

            jest.spyOn(service, 'listEventFailures').mockImplementation(async () => mockResult);

            // Act
            const response = await controller.listEventFailures(BrokerTypes.NP, 'JIRA', 5, 'AS-test.klmx');

            //Assert
            expect(response).toEqual(mockResult);
        });

        it('can listEventFailures() with filters using targetArn', async () => {
            // Arrange
            const mockResult: PagedFailureMessage = {
                Data: [
                    {
                        SubscriberApp: 'JIRA',
                        ErrorMessage: 'Lack of permissions to invoke cross account target.',
                        RuleArn: 'arn:aws:events:ap-southeast-2:727026770742:rule/EAI-EventBus-AS-NP/AS-test.klmx',
                        MessageId: 'f0622c6c-6a75-42bd-a922-10462dc9fd8f',
                        TTL: 1667984097,
                        SentTimestamp: '2022-11-09T08:54:57.273Z',
                        ErrorCode: 'NO_PERMISSIONS',
                        Body: '{"version":"0","id":"4a6397a2-42c3-e221-323a-5736db9d85b2","detail-type":"Event","source":"wel.climate-strategy.carbon","account":"727026770742","time":"2022-11-09T08:45:44Z","region":"ap-southeast-2","resources":[],"detail":{"Metadata":{"Guid":"2022-SAR-00116|approver|jayanta.das@dev.woodside.com.au|test","Time":1661327407424,"Version":"1","Action":"add","Producer":"TEST PRODUCER Failure events"},"Data":{"UserId":"XW54177","CreationDate":"2022-08-24T07:50:06.813Z","DisplayName":"Site Access Request Form - test","DueDate":"2022-08-27T07:49:28.000Z","Email":"jayanta.das@dev.woodside.com.au","Id":"2022-SAR-00116|approver|jayanta.das@dev.woodside.com.au|test","SourceUrl":"http://sar-test.dev.app.woodside/myworklist/2022-SAR-00116/approval","TaskType":"Site Access Request Form - Pending Approval","Category":"SAR","Title":"Site Access Request – Approval Required for Form 2022-SAR-00116 - for Saha, Jit (TATA CONSULTANCY SERVICES LTD), for Location KGP and Mobilisation Date: 27/08/2022"}}}',
                        TargetArn: 'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-AS-TEST-BUS-1',
                        EventTimestamp: '2022-08-24T07:50:06.813Z',
                        EventId: '4a6397a2-42c3-e221-323a-5736db9d85b2',
                        Attributes: {
                            SenderId: 'AIDAIDYJ7RPI7CT46XWPK',
                            ApproximateReceiveCount: '1',
                            ApproximateFirstReceiveTimestamp: '1667984097275',
                        },
                        SourceArn: 'arn:aws:sqs:ap-southeast-2:727026770742:EAI-EventBus-TargetDLQ-AS-NP',
                        RetryAttempts: 1,
                        SubscriptionId: 'IDMS.maintenance.FunctionalLocationCreated.9q0p4',
                    },
                    {
                        SubscriberApp: 'JIRA',
                        ErrorMessage: 'Lack of permissions to invoke cross account target.',
                        RuleArn: 'arn:aws:events:ap-southeast-2:727026770742:rule/EAI-EventBus-AS-NP/AS-test.klmx',
                        MessageId: 'df1666fa-ea6c-4a9c-a0eb-d9953e8f2924',
                        TTL: 1667984097,
                        SentTimestamp: '2022-11-09T08:54:57.892Z',
                        ErrorCode: 'NO_PERMISSIONS',
                        Body: '{"version":"0","id":"b47b0c3f-6769-4ab6-727c-699324e153d2","detail-type":"Event","source":"wel.climate-strategy.carbon","account":"727026770742","time":"2022-11-09T08:45:44Z","region":"ap-southeast-2","resources":[],"detail":{"Metadata":{"Guid":"2022-SAR-00116|approver|jayanta.das@dev.woodside.com.au|test","Time":1661327407424,"Version":"1","Action":"add","Producer":"TEST PRODUCER Failure events"},"Data":{"UserId":"XW54177","CreationDate":"2022-08-24T07:50:06.813Z","DisplayName":"Site Access Request Form - test","DueDate":"2022-08-27T07:49:28.000Z","Email":"jayanta.das@dev.woodside.com.au","Id":"2022-SAR-00116|approver|jayanta.das@dev.woodside.com.au|test","SourceUrl":"http://sar-test.dev.app.woodside/myworklist/2022-SAR-00116/approval","TaskType":"Site Access Request Form - Pending Approval","Category":"SAR","Title":"Site Access Request – Approval Required for Form 2022-SAR-00116 - for Saha, Jit (TATA CONSULTANCY SERVICES LTD), for Location KGP and Mobilisation Date: 27/08/2022"}}}',
                        TargetArn: 'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-AS-TEST-BUS-1',
                        EventTimestamp: '2022-08-24T07:50:06.813Z',
                        EventId: 'b47b0c3f-6769-4ab6-727c-699324e153d2',
                        Attributes: {
                            SenderId: 'AIDAIDYJ7RPI7CT46XWPK',
                            ApproximateReceiveCount: '1',
                            ApproximateFirstReceiveTimestamp: '1667984097894',
                        },
                        SourceArn: 'arn:aws:sqs:ap-southeast-2:727026770742:EAI-EventBus-TargetDLQ-AS-NP',
                        RetryAttempts: 1,
                        SubscriptionId: 'IDMS.maintenance.FunctionalLocationChanged.fj8kn',
                    },
                ],
            };

            jest.spyOn(service, 'listEventFailures').mockImplementation(async () => mockResult);

            // Act
            const response = await controller.listEventFailures(
                BrokerTypes.NP,
                'JIRA',
                2,
                undefined,
                'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-AS-TEST-BUS-1',
            );

            //Assert
            expect(response).toEqual(mockResult);
        });

        it('can listEventFailures() with filters using date range', async () => {
            // Arrange
            const mockResult: PagedFailureMessage = {
                Data: [
                    {
                        SubscriberApp: 'JIRA',
                        ErrorMessage: 'Lack of permissions to invoke cross account target.',
                        RuleArn: 'arn:aws:events:ap-southeast-2:727026770742:rule/EAI-EventBus-AS-NP/AS-test.klmx',
                        MessageId: 'f0622c6c-6a75-42bd-a922-10462dc9fd8f',
                        TTL: 1667984097,
                        SentTimestamp: '2022-11-09T08:54:57.273Z',
                        ErrorCode: 'NO_PERMISSIONS',
                        Body: '{"version":"0","id":"4a6397a2-42c3-e221-323a-5736db9d85b2","detail-type":"Event","source":"wel.climate-strategy.carbon","account":"727026770742","time":"2022-11-09T08:45:44Z","region":"ap-southeast-2","resources":[],"detail":{"Metadata":{"Guid":"2022-SAR-00116|approver|jayanta.das@dev.woodside.com.au|test","Time":1661327407424,"Version":"1","Action":"add","Producer":"TEST PRODUCER Failure events"},"Data":{"UserId":"XW54177","CreationDate":"2022-08-24T07:50:06.813Z","DisplayName":"Site Access Request Form - test","DueDate":"2022-08-27T07:49:28.000Z","Email":"jayanta.das@dev.woodside.com.au","Id":"2022-SAR-00116|approver|jayanta.das@dev.woodside.com.au|test","SourceUrl":"http://sar-test.dev.app.woodside/myworklist/2022-SAR-00116/approval","TaskType":"Site Access Request Form - Pending Approval","Category":"SAR","Title":"Site Access Request – Approval Required for Form 2022-SAR-00116 - for Saha, Jit (TATA CONSULTANCY SERVICES LTD), for Location KGP and Mobilisation Date: 27/08/2022"}}}',
                        TargetArn: 'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-AS-TEST-BUS-1',
                        EventTimestamp: '2022-08-24T07:50:06.813Z',
                        EventId: '4a6397a2-42c3-e221-323a-5736db9d85b2',
                        Attributes: {
                            SenderId: 'AIDAIDYJ7RPI7CT46XWPK',
                            ApproximateReceiveCount: '1',
                            ApproximateFirstReceiveTimestamp: '1667984097275',
                        },
                        SourceArn: 'arn:aws:sqs:ap-southeast-2:727026770742:EAI-EventBus-TargetDLQ-AS-NP',
                        RetryAttempts: 1,
                        SubscriptionId: 'IDMS.maintenance.FunctionalLocationCreated.9q0p4',
                    },
                    {
                        SubscriberApp: 'JIRA',
                        ErrorMessage: 'Lack of permissions to invoke cross account target.',
                        RuleArn: 'arn:aws:events:ap-southeast-2:727026770742:rule/EAI-EventBus-AS-NP/AS-test.klmx',
                        MessageId: 'df1666fa-ea6c-4a9c-a0eb-d9953e8f2924',
                        TTL: 1667984097,
                        SentTimestamp: '2022-11-09T08:54:57.892Z',
                        ErrorCode: 'NO_PERMISSIONS',
                        Body: '{"version":"0","id":"b47b0c3f-6769-4ab6-727c-699324e153d2","detail-type":"Event","source":"wel.climate-strategy.carbon","account":"727026770742","time":"2022-11-09T08:45:44Z","region":"ap-southeast-2","resources":[],"detail":{"Metadata":{"Guid":"2022-SAR-00116|approver|jayanta.das@dev.woodside.com.au|test","Time":1661327407424,"Version":"1","Action":"add","Producer":"TEST PRODUCER Failure events"},"Data":{"UserId":"XW54177","CreationDate":"2022-08-24T07:50:06.813Z","DisplayName":"Site Access Request Form - test","DueDate":"2022-08-27T07:49:28.000Z","Email":"jayanta.das@dev.woodside.com.au","Id":"2022-SAR-00116|approver|jayanta.das@dev.woodside.com.au|test","SourceUrl":"http://sar-test.dev.app.woodside/myworklist/2022-SAR-00116/approval","TaskType":"Site Access Request Form - Pending Approval","Category":"SAR","Title":"Site Access Request – Approval Required for Form 2022-SAR-00116 - for Saha, Jit (TATA CONSULTANCY SERVICES LTD), for Location KGP and Mobilisation Date: 27/08/2022"}}}',
                        TargetArn: 'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-AS-TEST-BUS-1',
                        EventTimestamp: '2022-08-24T07:50:06.813Z',
                        EventId: 'b47b0c3f-6769-4ab6-727c-699324e153d2',
                        Attributes: {
                            SenderId: 'AIDAIDYJ7RPI7CT46XWPK',
                            ApproximateReceiveCount: '1',
                            ApproximateFirstReceiveTimestamp: '1667984097894',
                        },
                        SourceArn: 'arn:aws:sqs:ap-southeast-2:727026770742:EAI-EventBus-TargetDLQ-AS-NP',
                        RetryAttempts: 1,
                        SubscriptionId: 'IDMS.maintenance.FunctionalLocationChanged.fj8kn',
                    },
                ],
            };

            jest.spyOn(service, 'listEventFailures').mockImplementation(async () => mockResult);

            // Act
            const response = await controller.listEventFailures(
                BrokerTypes.NP,
                'JIRA',
                2,
                undefined,
                undefined,
                undefined,
                '2022-08-24T06:00:00.000Z',
                '2022-08-24T14:00:00.000Z',
            );

            //Assert
            expect(response).toEqual(mockResult);
        });

        it('can listEventFailures() with filters using subscriptionId and offset keys', async () => {
            // Arrange
            const mockResult: PagedFailureMessage = {
                Data: [
                    {
                        SubscriberApp: 'JIRA',
                        ErrorMessage: 'Lack of permissions to invoke cross account target.',
                        RuleArn: 'arn:aws:events:ap-southeast-2:727026770742:rule/EAI-EventBus-AS-NP/AS-test.klmx',
                        MessageId: 'caf52ebe-3170-4143-bda6-ea0d8654c3db',
                        TTL: 1667984118,
                        SentTimestamp: '2022-11-09T08:55:18.301Z',
                        ErrorCode: 'NO_PERMISSIONS',
                        Body: '{"version":"0","id":"7d0827b8-dca3-5119-84e6-132adec4eaf2","detail-type":"Event","source":"wel.climate-strategy.carbon","account":"727026770742","time":"2022-11-09T08:45:44Z","region":"ap-southeast-2","resources":[],"detail":{"Metadata":{"Guid":"2022-SAR-00116|approver|jayanta.das@dev.woodside.com.au|test","Time":1661327407424,"Version":"1","Action":"add","Producer":"TEST PRODUCER Failure events"},"Data":{"UserId":"XW54177","CreationDate":"2022-08-24T07:50:06.813Z","DisplayName":"Site Access Request Form - test","DueDate":"2022-08-27T07:49:28.000Z","Email":"jayanta.das@dev.woodside.com.au","Id":"2022-SAR-00116|approver|jayanta.das@dev.woodside.com.au|test","SourceUrl":"http://sar-test.dev.app.woodside/myworklist/2022-SAR-00116/approval","TaskType":"Site Access Request Form - Pending Approval","Category":"SAR","Title":"Site Access Request – Approval Required for Form 2022-SAR-00116 - for Saha, Jit (TATA CONSULTANCY SERVICES LTD), for Location KGP and Mobilisation Date: 27/08/2022"}}}',
                        TargetArn: 'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-AS-TEST-BUS-1',
                        EventTimestamp: '2022-08-24T07:50:06.813Z',
                        EventId: '7d0827b8-dca3-5119-84e6-132adec4eaf2',
                        Attributes: {
                            SenderId: 'AIDAIDYJ7RPI7CT46XWPK',
                            ApproximateReceiveCount: '1',
                            ApproximateFirstReceiveTimestamp: '1667984118302',
                        },
                        SourceArn: 'arn:aws:sqs:ap-southeast-2:727026770742:EAI-EventBus-TargetDLQ-AS-NP',
                        RetryAttempts: 1,
                        SubscriptionId: 'IDMS.maintenance.FunctionalLocationCreated.9q0p4',
                    },
                    {
                        SubscriberApp: 'JIRA',
                        ErrorMessage: 'Lack of permissions to invoke cross account target.',
                        RuleArn: 'arn:aws:events:ap-southeast-2:727026770742:rule/EAI-EventBus-AS-NP/AS-test.klmx',
                        MessageId: '33ff511b-fc82-4a8a-90a0-2c3c6cfd6c95',
                        TTL: 1667984120,
                        SentTimestamp: '2022-11-09T08:55:20.480Z',
                        ErrorCode: 'NO_PERMISSIONS',
                        Body: '{"version":"0","id":"fdd2f3d3-ad0b-8d90-b4fa-d78d6007045a","detail-type":"Event","source":"wel.climate-strategy.carbon","account":"727026770742","time":"2022-11-09T08:45:44Z","region":"ap-southeast-2","resources":[],"detail":{"Metadata":{"Guid":"2022-SAR-00116|approver|jayanta.das@dev.woodside.com.au|test","Time":1661327407424,"Version":"1","Action":"add","Producer":"TEST PRODUCER Failure events"},"Data":{"UserId":"XW54177","CreationDate":"2022-08-24T07:50:06.813Z","DisplayName":"Site Access Request Form - test","DueDate":"2022-08-27T07:49:28.000Z","Email":"jayanta.das@dev.woodside.com.au","Id":"2022-SAR-00116|approver|jayanta.das@dev.woodside.com.au|test","SourceUrl":"http://sar-test.dev.app.woodside/myworklist/2022-SAR-00116/approval","TaskType":"Site Access Request Form - Pending Approval","Category":"SAR","Title":"Site Access Request – Approval Required for Form 2022-SAR-00116 - for Saha, Jit (TATA CONSULTANCY SERVICES LTD), for Location KGP and Mobilisation Date: 27/08/2022"}}}',
                        TargetArn: 'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-AS-TEST-BUS-1',
                        EventTimestamp: '2022-08-24T07:50:06.813Z',
                        EventId: 'fdd2f3d3-ad0b-8d90-b4fa-d78d6007045a',
                        Attributes: {
                            SenderId: 'AIDAIDYJ7RPI7CT46XWPK',
                            ApproximateReceiveCount: '1',
                            ApproximateFirstReceiveTimestamp: '1667984120481',
                        },
                        SourceArn: 'arn:aws:sqs:ap-southeast-2:727026770742:EAI-EventBus-TargetDLQ-AS-NP',
                        RetryAttempts: 1,
                        SubscriptionId: 'IDMS.maintenance.FunctionalLocationChanged.fj8kn',
                    },
                ],
                Offset: {
                    PK: 'ERR#AS-test.klmx#EAI-AS-TEST-BUS-1',
                    SK: '#2022-11-09T08:54:04.679Z',
                },
            };

            const mockResultWithOffset = {
                Data: [
                    {
                        SubscriberApp: 'JIRA',
                        ErrorMessage: 'Lack of permissions to invoke cross account target.',
                        RuleArn: 'arn:aws:events:ap-southeast-2:727026770742:rule/EAI-EventBus-AS-NP/AS-test.klmx',
                        MessageId: 'f0622c6c-6a75-42bd-a922-10462dc9fd8f',
                        TTL: 1667984097,
                        SentTimestamp: '2022-11-09T08:54:57.273Z',
                        ErrorCode: 'NO_PERMISSIONS',
                        Body: '{"version":"0","id":"4a6397a2-42c3-e221-323a-5736db9d85b2","detail-type":"Event","source":"wel.climate-strategy.carbon","account":"727026770742","time":"2022-11-09T08:45:44Z","region":"ap-southeast-2","resources":[],"detail":{"Metadata":{"Guid":"2022-SAR-00116|approver|jayanta.das@dev.woodside.com.au|test","Time":1661327407424,"Version":"1","Action":"add","Producer":"TEST PRODUCER Failure events"},"Data":{"UserId":"XW54177","CreationDate":"2022-08-24T07:50:06.813Z","DisplayName":"Site Access Request Form - test","DueDate":"2022-08-27T07:49:28.000Z","Email":"jayanta.das@dev.woodside.com.au","Id":"2022-SAR-00116|approver|jayanta.das@dev.woodside.com.au|test","SourceUrl":"http://sar-test.dev.app.woodside/myworklist/2022-SAR-00116/approval","TaskType":"Site Access Request Form - Pending Approval","Category":"SAR","Title":"Site Access Request – Approval Required for Form 2022-SAR-00116 - for Saha, Jit (TATA CONSULTANCY SERVICES LTD), for Location KGP and Mobilisation Date: 27/08/2022"}}}',
                        TargetArn: 'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-AS-TEST-BUS-1',
                        EventTimestamp: '2022-08-24T07:50:06.813Z',
                        SK: '#2022-11-09T08:54:57.273Z',
                        EventId: '4a6397a2-42c3-e221-323a-5736db9d85b2',
                        Attributes: {
                            SenderId: 'AIDAIDYJ7RPI7CT46XWPK',
                            ApproximateReceiveCount: '1',
                            ApproximateFirstReceiveTimestamp: '1667984097275',
                        },
                        PK: 'ERR#AS-test.klmx#EAI-AS-TEST-BUS-1',
                        SourceArn: 'arn:aws:sqs:ap-southeast-2:727026770742:EAI-EventBus-TargetDLQ-AS-NP',
                        RetryAttempts: 1,
                        SubscriptionId: 'IDMS.maintenance.FunctionalLocationCreated.9q0p4',
                    },
                    {
                        SubscriberApp: 'JIRA',
                        ErrorMessage: 'Lack of permissions to invoke cross account target.',
                        RuleArn: 'arn:aws:events:ap-southeast-2:727026770742:rule/EAI-EventBus-AS-NP/AS-test.klmx',
                        MessageId: 'df1666fa-ea6c-4a9c-a0eb-d9953e8f2924',
                        TTL: 1667984097,
                        SentTimestamp: '2022-11-09T08:54:57.892Z',
                        ErrorCode: 'NO_PERMISSIONS',
                        Body: '{"version":"0","id":"b47b0c3f-6769-4ab6-727c-699324e153d2","detail-type":"Event","source":"wel.climate-strategy.carbon","account":"727026770742","time":"2022-11-09T08:45:44Z","region":"ap-southeast-2","resources":[],"detail":{"Metadata":{"Guid":"2022-SAR-00116|approver|jayanta.das@dev.woodside.com.au|test","Time":1661327407424,"Version":"1","Action":"add","Producer":"TEST PRODUCER Failure events"},"Data":{"UserId":"XW54177","CreationDate":"2022-08-24T07:50:06.813Z","DisplayName":"Site Access Request Form - test","DueDate":"2022-08-27T07:49:28.000Z","Email":"jayanta.das@dev.woodside.com.au","Id":"2022-SAR-00116|approver|jayanta.das@dev.woodside.com.au|test","SourceUrl":"http://sar-test.dev.app.woodside/myworklist/2022-SAR-00116/approval","TaskType":"Site Access Request Form - Pending Approval","Category":"SAR","Title":"Site Access Request – Approval Required for Form 2022-SAR-00116 - for Saha, Jit (TATA CONSULTANCY SERVICES LTD), for Location KGP and Mobilisation Date: 27/08/2022"}}}',
                        TargetArn: 'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-AS-TEST-BUS-1',
                        EventTimestamp: '2022-08-24T07:50:06.813Z',
                        SK: '#2022-11-09T08:54:57.892Z',
                        EventId: 'b47b0c3f-6769-4ab6-727c-699324e153d2',
                        Attributes: {
                            SenderId: 'AIDAIDYJ7RPI7CT46XWPK',
                            ApproximateReceiveCount: '1',
                            ApproximateFirstReceiveTimestamp: '1667984097894',
                        },
                        PK: 'ERR#AS-test.klmx#EAI-AS-TEST-BUS-1',
                        SourceArn: 'arn:aws:sqs:ap-southeast-2:727026770742:EAI-EventBus-TargetDLQ-AS-NP',
                        RetryAttempts: 1,
                        SubscriptionId: 'IDMS.maintenance.FunctionalLocationChanged.fj8kn',
                    },
                ],
                Offset: {
                    PK: 'ERR#AS-test.klmx#EAI-AS-TEST-BUS-1',
                    SK: '#2022-11-09T08:54:57.892Z',
                },
            };

            jest.spyOn(service, 'listEventFailures').mockImplementationOnce(async () => mockResult);
            jest.spyOn(service, 'listEventFailures').mockImplementationOnce(async () => mockResultWithOffset);

            // Act
            const response = await controller.listEventFailures(BrokerTypes.NP, 'JIRA', 2, 'AS-test.klmx');
            const offset = `${response!.Offset!.PK}#${response!.Offset!.SK}`;
            const responseWithOffset = await controller.listEventFailures(
                BrokerTypes.NP,
                'JIRA',
                2,
                offset,
                'AS-test.klmx',
            );

            //Assert
            expect(response).toEqual(mockResult);
            expect(responseWithOffset).toEqual(mockResultWithOffset);
        });

        it('can listEventFailures() with filters using targetArn and offset keys', async () => {
            // Arrange
            const mockResult: PagedFailureMessage = {
                Data: [
                    {
                        SubscriberApp: 'JIRA',
                        ErrorMessage: 'Lack of permissions to invoke cross account target.',
                        RuleArn: 'arn:aws:events:ap-southeast-2:727026770742:rule/EAI-EventBus-AS-NP/AS-test.klmx',
                        MessageId: 'f0622c6c-6a75-42bd-a922-10462dc9fd8f',
                        TTL: 1667984097,
                        SentTimestamp: '2022-11-09T08:54:57.273Z',
                        ErrorCode: 'NO_PERMISSIONS',
                        Body: '{"version":"0","id":"4a6397a2-42c3-e221-323a-5736db9d85b2","detail-type":"Event","source":"wel.climate-strategy.carbon","account":"727026770742","time":"2022-11-09T08:45:44Z","region":"ap-southeast-2","resources":[],"detail":{"Metadata":{"Guid":"2022-SAR-00116|approver|jayanta.das@dev.woodside.com.au|test","Time":1661327407424,"Version":"1","Action":"add","Producer":"TEST PRODUCER Failure events"},"Data":{"UserId":"XW54177","CreationDate":"2022-08-24T07:50:06.813Z","DisplayName":"Site Access Request Form - test","DueDate":"2022-08-27T07:49:28.000Z","Email":"jayanta.das@dev.woodside.com.au","Id":"2022-SAR-00116|approver|jayanta.das@dev.woodside.com.au|test","SourceUrl":"http://sar-test.dev.app.woodside/myworklist/2022-SAR-00116/approval","TaskType":"Site Access Request Form - Pending Approval","Category":"SAR","Title":"Site Access Request – Approval Required for Form 2022-SAR-00116 - for Saha, Jit (TATA CONSULTANCY SERVICES LTD), for Location KGP and Mobilisation Date: 27/08/2022"}}}',
                        TargetArn: 'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-AS-TEST-BUS-1',
                        EventTimestamp: '2022-08-24T07:50:06.813Z',
                        EventId: '4a6397a2-42c3-e221-323a-5736db9d85b2',
                        Attributes: {
                            SenderId: 'AIDAIDYJ7RPI7CT46XWPK',
                            ApproximateReceiveCount: '1',
                            ApproximateFirstReceiveTimestamp: '1667984097275',
                        },
                        SourceArn: 'arn:aws:sqs:ap-southeast-2:727026770742:EAI-EventBus-TargetDLQ-AS-NP',
                        RetryAttempts: 1,
                        SubscriptionId: 'IDMS.maintenance.FunctionalLocationCreated.9q0p4',
                    },
                    {
                        SubscriberApp: 'JIRA',
                        ErrorMessage: 'Lack of permissions to invoke cross account target.',
                        RuleArn: 'arn:aws:events:ap-southeast-2:727026770742:rule/EAI-EventBus-AS-NP/AS-test.klmx',
                        MessageId: 'df1666fa-ea6c-4a9c-a0eb-d9953e8f2924',
                        TTL: 1667984097,
                        SentTimestamp: '2022-11-09T08:54:57.892Z',
                        ErrorCode: 'NO_PERMISSIONS',
                        Body: '{"version":"0","id":"b47b0c3f-6769-4ab6-727c-699324e153d2","detail-type":"Event","source":"wel.climate-strategy.carbon","account":"727026770742","time":"2022-11-09T08:45:44Z","region":"ap-southeast-2","resources":[],"detail":{"Metadata":{"Guid":"2022-SAR-00116|approver|jayanta.das@dev.woodside.com.au|test","Time":1661327407424,"Version":"1","Action":"add","Producer":"TEST PRODUCER Failure events"},"Data":{"UserId":"XW54177","CreationDate":"2022-08-24T07:50:06.813Z","DisplayName":"Site Access Request Form - test","DueDate":"2022-08-27T07:49:28.000Z","Email":"jayanta.das@dev.woodside.com.au","Id":"2022-SAR-00116|approver|jayanta.das@dev.woodside.com.au|test","SourceUrl":"http://sar-test.dev.app.woodside/myworklist/2022-SAR-00116/approval","TaskType":"Site Access Request Form - Pending Approval","Category":"SAR","Title":"Site Access Request – Approval Required for Form 2022-SAR-00116 - for Saha, Jit (TATA CONSULTANCY SERVICES LTD), for Location KGP and Mobilisation Date: 27/08/2022"}}}',
                        TargetArn: 'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-AS-TEST-BUS-1',
                        EventTimestamp: '2022-08-24T07:50:06.813Z',
                        EventId: 'b47b0c3f-6769-4ab6-727c-699324e153d2',
                        Attributes: {
                            SenderId: 'AIDAIDYJ7RPI7CT46XWPK',
                            ApproximateReceiveCount: '1',
                            ApproximateFirstReceiveTimestamp: '1667984097894',
                        },
                        SourceArn: 'arn:aws:sqs:ap-southeast-2:727026770742:EAI-EventBus-TargetDLQ-AS-NP',
                        RetryAttempts: 1,
                        SubscriptionId: 'IDMS.maintenance.FunctionalLocationChanged.fj8kn',
                    },
                ],
                Offset: {
                    PK: 'ERR#AS-test.klmx#EAI-AS-TEST-BUS-1',
                    SK: '#2022-11-09T08:54:57.892Z',
                },
            };

            const mockResultWithOffset = {
                Data: [
                    {
                        SubscriberApp: 'JIRA',
                        ErrorMessage: 'Lack of permissions to invoke cross account target.',
                        RuleArn: 'arn:aws:events:ap-southeast-2:727026770742:rule/EAI-EventBus-AS-NP/AS-test.klmx',
                        MessageId: 'e3768f82-9f03-46b4-b3c6-7fcbb38c54d8',
                        TTL: 1667984100,
                        SentTimestamp: '2022-11-09T08:55:00.328Z',
                        ErrorCode: 'NO_PERMISSIONS',
                        Body: '{"version":"0","id":"1dbc2b3c-4c4d-937e-ec17-58cc047cb939","detail-type":"Event","source":"wel.climate-strategy.carbon","account":"727026770742","time":"2022-11-09T08:45:44Z","region":"ap-southeast-2","resources":[],"detail":{"Metadata":{"Guid":"2022-SAR-00116|approver|jayanta.das@dev.woodside.com.au|test","Time":1661327407424,"Version":"1","Action":"add","Producer":"TEST PRODUCER Failure events"},"Data":{"UserId":"XW54177","CreationDate":"2022-08-24T07:50:06.813Z","DisplayName":"Site Access Request Form - test","DueDate":"2022-08-27T07:49:28.000Z","Email":"jayanta.das@dev.woodside.com.au","Id":"2022-SAR-00116|approver|jayanta.das@dev.woodside.com.au|test","SourceUrl":"http://sar-test.dev.app.woodside/myworklist/2022-SAR-00116/approval","TaskType":"Site Access Request Form - Pending Approval","Category":"SAR","Title":"Site Access Request – Approval Required for Form 2022-SAR-00116 - for Saha, Jit (TATA CONSULTANCY SERVICES LTD), for Location KGP and Mobilisation Date: 27/08/2022"}}}',
                        TargetArn: 'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-AS-TEST-BUS-1',
                        EventTimestamp: '2022-08-24T07:50:06.813Z',
                        EventId: '1dbc2b3c-4c4d-937e-ec17-58cc047cb939',
                        Attributes: {
                            SenderId: 'AIDAIDYJ7RPI7CT46XWPK',
                            ApproximateReceiveCount: '1',
                            ApproximateFirstReceiveTimestamp: '1667984100334',
                        },
                        SourceArn: 'arn:aws:sqs:ap-southeast-2:727026770742:EAI-EventBus-TargetDLQ-AS-NP',
                        RetryAttempts: 1,
                        SubscriptionId: 'IDMS.maintenance.FunctionalLocationCreated.9q0p4',
                    },
                    {
                        SubscriberApp: 'JIRA',
                        ErrorMessage: 'Lack of permissions to invoke cross account target.',
                        RuleArn: 'arn:aws:events:ap-southeast-2:727026770742:rule/EAI-EventBus-AS-NP/AS-test.klmx',
                        MessageId: '7200d08f-4887-468b-b628-21e417922d37',
                        TTL: 1667984103,
                        SentTimestamp: '2022-11-09T08:55:03.301Z',
                        ErrorCode: 'NO_PERMISSIONS',
                        Body: '{"version":"0","id":"555ad5ac-a415-8de0-46cc-cfb4b1864537","detail-type":"Event","source":"wel.climate-strategy.carbon","account":"727026770742","time":"2022-11-09T08:45:44Z","region":"ap-southeast-2","resources":[],"detail":{"Metadata":{"Guid":"2022-SAR-00116|approver|jayanta.das@dev.woodside.com.au|test","Time":1661327407424,"Version":"1","Action":"add","Producer":"TEST PRODUCER Failure events"},"Data":{"UserId":"XW54177","CreationDate":"2022-08-24T07:50:06.813Z","DisplayName":"Site Access Request Form - test","DueDate":"2022-08-27T07:49:28.000Z","Email":"jayanta.das@dev.woodside.com.au","Id":"2022-SAR-00116|approver|jayanta.das@dev.woodside.com.au|test","SourceUrl":"http://sar-test.dev.app.woodside/myworklist/2022-SAR-00116/approval","TaskType":"Site Access Request Form - Pending Approval","Category":"SAR","Title":"Site Access Request – Approval Required for Form 2022-SAR-00116 - for Saha, Jit (TATA CONSULTANCY SERVICES LTD), for Location KGP and Mobilisation Date: 27/08/2022"}}}',
                        TargetArn: 'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-AS-TEST-BUS-1',
                        EventTimestamp: '2022-08-24T07:50:06.813Z',
                        EventId: '555ad5ac-a415-8de0-46cc-cfb4b1864537',
                        Attributes: {
                            SenderId: 'AIDAIDYJ7RPI7CT46XWPK',
                            ApproximateReceiveCount: '1',
                            ApproximateFirstReceiveTimestamp: '1667984103304',
                        },
                        SourceArn: 'arn:aws:sqs:ap-southeast-2:727026770742:EAI-EventBus-TargetDLQ-AS-NP',
                        RetryAttempts: 1,
                        SubscriptionId: 'IDMS.maintenance.FunctionalLocationChanged.fj8kn',
                    },
                ],
                Offset: {
                    PK: 'ERR#AS-test.klmx#EAI-AS-TEST-BUS-1',
                    SK: '#2022-11-09T08:55:03.301Z',
                },
            };

            jest.spyOn(service, 'listEventFailures').mockImplementationOnce(async () => mockResult);
            jest.spyOn(service, 'listEventFailures').mockImplementationOnce(async () => mockResultWithOffset);

            // Act
            const response = await controller.listEventFailures(
                BrokerTypes.NP,
                'JIRA',
                2,
                undefined,
                '                arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-AS-TEST-BUS-1',
            );
            const offset = `${response!.Offset!.PK}#${response!.Offset!.SK}`;
            const responseWithOffset = await controller.listEventFailures(
                BrokerTypes.NP,
                'JIRA',
                2,
                offset,
                undefined,
                'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-AS-TEST-BUS-1',
            );

            //Assert
            expect(response).toEqual(mockResult);
            expect(responseWithOffset).toEqual(mockResultWithOffset);
        });
    });
});
