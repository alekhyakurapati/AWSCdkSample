import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DynamoDBDocument, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { STS } from '@aws-sdk/client-sts';
import { mockClient } from 'aws-sdk-client-mock';

import { AwsService } from '@eai-event-integration-platform/api/aws';
import { BrokerTypes, PagedFailureMessage } from '@eai-event-integration-platform/interfaces';
import { EventFailuresService } from './event-failures.service';
import { EventFailuresRepository } from './event-failures.repository';

const ddbDockMock = mockClient(DynamoDBDocument);
const stsMock = mockClient(STS);

describe('EventFailuresService', () => {
    let eventFailureService: EventFailuresService;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                EventFailuresService,
                EventFailuresRepository,
                AwsService,
                {
                    provide: ConfigService,
                    useValue: {
                        getOrThrow: jest.fn((key: string) => ''),
                    },
                },
                {
                    provide: DynamoDBDocument,
                    useFactory: async () => DynamoDBDocument.from(new DynamoDB({ region: 'ap-southeast-2' })),
                },
                { provide: STS, useFactory: async () => new STS({ region: 'ap-southeast-2' }) },
            ],
        }).compile();
        eventFailureService = module.get(EventFailuresService);
        stsMock.reset();
    });

    it('should be defined', () => {
        expect(eventFailureService).toBeTruthy();
    });
    describe('listEventFailures', () => {
        it('listEventFailures() should return a list of event failures', async () => {
            // Arrange
            const mockDynamoDBData = [
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
            ];
            const mockKey = {
                EventTimestamp: '2022-08-24T07:50:06.813Z',
                SK: '#2022-10-27T06:46:59.162Z',
                PK: 'ERR#AS-test-Eventbridege-rule#EAI-AS-TEST-BUS',
                SubscriberApp: 'JIRA',
            };
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
                    EventTimestamp: '2022-08-24T07:50:06.813Z',
                    SK: '#2022-10-27T06:46:59.162Z',
                    PK: 'ERR#AS-test-Eventbridege-rule#EAI-AS-TEST-BUS',
                    SubscriberApp: 'JIRA',
                },
            };
            ddbDockMock.on(QueryCommand).resolves({
                $metadata: { httpStatusCode: 200 },
                Items: mockDynamoDBData,
                LastEvaluatedKey: mockKey,
            });

            // Act
            const result = await eventFailureService.listEventFailures(BrokerTypes.NP, 'JIRA', 2);

            // Assert
            expect(result).toEqual(mockResult);
        });

        it('listEventFailures() should return a subset of event failures when filter is added', async () => {
            // Arrange
            const mockDynamoDBData = [
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
                    SK: '#2022-11-09T08:55:18.301Z',
                    EventId: '7d0827b8-dca3-5119-84e6-132adec4eaf2',
                    Attributes: {
                        SenderId: 'AIDAIDYJ7RPI7CT46XWPK',
                        ApproximateReceiveCount: '1',
                        ApproximateFirstReceiveTimestamp: '1667984118302',
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
                    MessageId: '33ff511b-fc82-4a8a-90a0-2c3c6cfd6c95',
                    TTL: 1667984120,
                    SentTimestamp: '2022-11-09T08:55:20.480Z',
                    ErrorCode: 'NO_PERMISSIONS',
                    Body: '{"version":"0","id":"fdd2f3d3-ad0b-8d90-b4fa-d78d6007045a","detail-type":"Event","source":"wel.climate-strategy.carbon","account":"727026770742","time":"2022-11-09T08:45:44Z","region":"ap-southeast-2","resources":[],"detail":{"Metadata":{"Guid":"2022-SAR-00116|approver|jayanta.das@dev.woodside.com.au|test","Time":1661327407424,"Version":"1","Action":"add","Producer":"TEST PRODUCER Failure events"},"Data":{"UserId":"XW54177","CreationDate":"2022-08-24T07:50:06.813Z","DisplayName":"Site Access Request Form - test","DueDate":"2022-08-27T07:49:28.000Z","Email":"jayanta.das@dev.woodside.com.au","Id":"2022-SAR-00116|approver|jayanta.das@dev.woodside.com.au|test","SourceUrl":"http://sar-test.dev.app.woodside/myworklist/2022-SAR-00116/approval","TaskType":"Site Access Request Form - Pending Approval","Category":"SAR","Title":"Site Access Request – Approval Required for Form 2022-SAR-00116 - for Saha, Jit (TATA CONSULTANCY SERVICES LTD), for Location KGP and Mobilisation Date: 27/08/2022"}}}',
                    TargetArn: 'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-AS-TEST-BUS-1',
                    EventTimestamp: '2022-08-24T07:50:06.813Z',
                    SK: '#2022-11-09T08:55:20.480Z',
                    EventId: 'fdd2f3d3-ad0b-8d90-b4fa-d78d6007045a',
                    Attributes: {
                        SenderId: 'AIDAIDYJ7RPI7CT46XWPK',
                        ApproximateReceiveCount: '1',
                        ApproximateFirstReceiveTimestamp: '1667984120481',
                    },
                    PK: 'ERR#AS-test.klmx#EAI-AS-TEST-BUS-1',
                    SourceArn: 'arn:aws:sqs:ap-southeast-2:727026770742:EAI-EventBus-TargetDLQ-AS-NP',
                    RetryAttempts: 1,
                    SubscriptionId: 'IDMS.maintenance.FunctionalLocationChanged.fj8kn',
                },
            ];

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
                    EventTimestamp: '2022-08-24T07:50:06.813Z',
                    SK: '#2022-10-27T06:46:59.162Z',
                    PK: 'ERR#AS-test-Eventbridege-rule#EAI-AS-TEST-BUS',
                    SubscriberApp: 'JIRA',
                },
            };

            const mockKey = {
                EventTimestamp: '2022-08-24T07:50:06.813Z',
                SK: '#2022-10-27T06:46:59.162Z',
                PK: 'ERR#AS-test-Eventbridege-rule#EAI-AS-TEST-BUS',
                SubscriberApp: 'JIRA',
            };

            ddbDockMock.on(QueryCommand).resolves({
                $metadata: { httpStatusCode: 200 },
                Items: mockDynamoDBData,
                LastEvaluatedKey: mockKey,
            });

            // Act
            const result = await eventFailureService.listEventFailures(
                BrokerTypes.NP,
                'JIRA',
                2,
                '{"PK": "AS-test.klmx"}',
            );

            // Assert
            expect(result).toEqual(mockResult);
        });
    });

    describe('listFilterValues', () => {
        it('should return filter values', async () => {
            // Arrange
            const mockDynamoDBData = [
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
                    SK: '#2022-11-09T08:55:18.301Z',
                    EventId: '7d0827b8-dca3-5119-84e6-132adec4eaf2',
                    Attributes: {
                        SenderId: 'AIDAIDYJ7RPI7CT46XWPK',
                        ApproximateReceiveCount: '1',
                        ApproximateFirstReceiveTimestamp: '1667984118302',
                    },
                    PK: 'ERR#AS-test.klmx#EAI-AS-TEST-BUS-1',
                    SourceArn: 'arn:aws:sqs:ap-southeast-2:727026770742:EAI-EventBus-TargetDLQ-AS-NP',
                    RetryAttempts: 1,
                    SubscriptionId: 'IDMS.maintenance.FunctionalLocationCreated.9q0p4',
                },
                {
                    SubscriberApp: 'JIRA',
                    ErrorMessage: 'Lack of permissions to invoke cross account target.',
                    RuleArn: 'arn:aws:events:ap-southeast-2:727026770742:rule/EAI-EventBus-AS-NP/AS-test',
                    MessageId: '33ff511b-fc82-4a8a-90a0-2c3c6cfd6c95',
                    TTL: 1667984120,
                    SentTimestamp: '2022-11-09T08:55:20.480Z',
                    ErrorCode: 'NO_PERMISSIONS',
                    Body: '{"version":"0","id":"fdd2f3d3-ad0b-8d90-b4fa-d78d6007045a","detail-type":"Event","source":"wel.climate-strategy.carbon","account":"727026770742","time":"2022-11-09T08:45:44Z","region":"ap-southeast-2","resources":[],"detail":{"Metadata":{"Guid":"2022-SAR-00116|approver|jayanta.das@dev.woodside.com.au|test","Time":1661327407424,"Version":"1","Action":"add","Producer":"TEST PRODUCER Failure events"},"Data":{"UserId":"XW54177","CreationDate":"2022-08-24T07:50:06.813Z","DisplayName":"Site Access Request Form - test","DueDate":"2022-08-27T07:49:28.000Z","Email":"jayanta.das@dev.woodside.com.au","Id":"2022-SAR-00116|approver|jayanta.das@dev.woodside.com.au|test","SourceUrl":"http://sar-test.dev.app.woodside/myworklist/2022-SAR-00116/approval","TaskType":"Site Access Request Form - Pending Approval","Category":"SAR","Title":"Site Access Request – Approval Required for Form 2022-SAR-00116 - for Saha, Jit (TATA CONSULTANCY SERVICES LTD), for Location KGP and Mobilisation Date: 27/08/2022"}}}',
                    TargetArn: 'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-AS-TEST-BUS',
                    EventTimestamp: '2022-08-24T07:50:06.813Z',
                    SK: '#2022-11-09T08:55:20.480Z',
                    EventId: 'fdd2f3d3-ad0b-8d90-b4fa-d78d6007045a',
                    Attributes: {
                        SenderId: 'AIDAIDYJ7RPI7CT46XWPK',
                        ApproximateReceiveCount: '1',
                        ApproximateFirstReceiveTimestamp: '1667984120481',
                    },
                    PK: 'ERR#AS-test.klmx#EAI-AS-TEST-BUS-1',
                    SourceArn: 'arn:aws:sqs:ap-southeast-2:727026770742:EAI-EventBus-TargetDLQ-AS-NP',
                    RetryAttempts: 1,
                    SubscriptionId: 'IDMS.maintenance.FunctionalLocationChanged.fj8kn',
                },
                {
                    SubscriberApp: 'JIRA',
                    ErrorMessage: 'Lack of permissions to invoke cross account target.',
                    RuleArn: 'arn:aws:events:ap-southeast-2:727026770742:rule/EAI-EventBus-AS-NP/AS-test.abcd',
                    MessageId: '33ff511b-fc82-4a8a-90a0-2c3c6cfd6c95',
                    TTL: 1667984120,
                    SentTimestamp: '2022-11-09T08:55:20.480Z',
                    ErrorCode: 'NO_PERMISSIONS',
                    Body: '{"version":"0","id":"fdd2f3d3-ad0b-8d90-b4fa-d78d6007045a","detail-type":"Event","source":"wel.climate-strategy.carbon","account":"727026770742","time":"2022-11-09T08:45:44Z","region":"ap-southeast-2","resources":[],"detail":{"Metadata":{"Guid":"2022-SAR-00116|approver|jayanta.das@dev.woodside.com.au|test","Time":1661327407424,"Version":"1","Action":"add","Producer":"TEST PRODUCER Failure events"},"Data":{"UserId":"XW54177","CreationDate":"2022-08-24T07:50:06.813Z","DisplayName":"Site Access Request Form - test","DueDate":"2022-08-27T07:49:28.000Z","Email":"jayanta.das@dev.woodside.com.au","Id":"2022-SAR-00116|approver|jayanta.das@dev.woodside.com.au|test","SourceUrl":"http://sar-test.dev.app.woodside/myworklist/2022-SAR-00116/approval","TaskType":"Site Access Request Form - Pending Approval","Category":"SAR","Title":"Site Access Request – Approval Required for Form 2022-SAR-00116 - for Saha, Jit (TATA CONSULTANCY SERVICES LTD), for Location KGP and Mobilisation Date: 27/08/2022"}}}',
                    TargetArn: 'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-AS-TEST-BUS-2',
                    EventTimestamp: '2022-08-24T07:50:06.813Z',
                    SK: '#2022-11-09T08:55:20.480Z',
                    EventId: 'fdd2f3d3-ad0b-8d90-b4fa-d78d6007045a',
                    Attributes: {
                        SenderId: 'AIDAIDYJ7RPI7CT46XWPK',
                        ApproximateReceiveCount: '1',
                        ApproximateFirstReceiveTimestamp: '1667984120481',
                    },
                    PK: 'ERR#AS-test.klmx#EAI-AS-TEST-BUS-1',
                    SourceArn: 'arn:aws:sqs:ap-southeast-2:727026770742:EAI-EventBus-TargetDLQ-AS-NP',
                    RetryAttempts: 1,
                    SubscriptionId: 'IDMS.maintenance.FunctionalLocationCreated.9q0p4',
                },
            ];

            ddbDockMock.on(QueryCommand).resolves({
                $metadata: { httpStatusCode: 200 },
                Items: mockDynamoDBData,
            });

            const mockResult = {
                SubscriptionIds: ['AS-test.klmx', 'AS-test', 'AS-test.abcd'],
                TargetArns: [
                    'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-AS-TEST-BUS-1',
                    'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-AS-TEST-BUS',
                    'arn:aws:events:ap-southeast-2:403024778660:event-bus/EAI-AS-TEST-BUS-2',
                ],
            };

            // Act

            const result = await eventFailureService.listFilterValues(BrokerTypes.NP, 'JIRA');

            // Assert
            expect(result).toEqual(mockResult);
        });
    });
});
