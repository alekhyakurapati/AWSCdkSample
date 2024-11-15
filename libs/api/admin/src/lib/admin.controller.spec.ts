import { AuthUser } from '@eai-event-integration-platform/api/auth';
import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BrokerTypes } from '@eai-event-integration-platform/interfaces';
import { EventBridge } from '@aws-sdk/client-eventbridge';
import { mockClient } from 'aws-sdk-client-mock';
import { STS } from '@aws-sdk/client-sts';

const ebMock = mockClient(EventBridge);
const stsMock = mockClient(STS);

describe('AdminController', () => {
    let controller: AdminController;
    const mockUser = { username: 'test' } as AuthUser;
    const mockRequest = { user: {} } as Request;
    mockRequest.user = mockUser;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AdminService,
                EventEmitter2,
                {
                    provide: ConfigService,
                    useValue: {
                        getOrThrow: jest.fn((key: string) => ''),
                    },
                },
                { provide: EventBridge, useFactory: async () => new EventBridge({ region: 'ap-southeast-2' }) },
                { provide: STS, useFactory: async () => new STS({ region: 'ap-southeast-2' }) },
            ],
            controllers: [AdminController],
        }).compile();

        controller = module.get(AdminController);

        stsMock.reset();
        ebMock.reset();
    });

    describe('create()', () => {
        it('can create permission on policy document at eventbridge if succesful', async () => {
            // Output
            const mockResult = {
                prodResult: {
                    $metadata: {
                        httpStatusCode: 200,
                        requestId: 'fc5b1fca-2bad-4ab6-9487-750e3ddbbd89',
                        attempts: 1,
                        totalRetryDelay: 0,
                    },
                },
                npResult: {
                    $metadata: {
                        httpStatusCode: 200,
                        requestId: 'ee82e8ce-b07f-4fa0-9a36-8a38e6c410fc',
                        attempts: 1,
                        totalRetryDelay: 0,
                    },
                },
            };

            jest.spyOn(controller, 'create').mockImplementation(async () => mockResult);

            //Act
            const response = await controller.create(
                {
                    Prod: {
                        AccountName: 'wpl-wrk-devtools-np',
                        AccountNumber: '403024778660',
                    },
                    NonProd: {
                        AccountName: 'wpl-wrk-devtools-np',
                        AccountNumber: '403024778660',
                    },
                },
                mockRequest,
            );

            // Assert
            expect(response).toEqual(mockResult);
        });

        it('Can return an error if exceptions are thrown', async () => {
            //Output
            const mockErrorMessage = 'test error message';
            jest.spyOn(controller, 'create').mockImplementation(async () => {
                throw new Error(mockErrorMessage);
            });

            //Act
            try {
                await controller.create(
                    {
                        Prod: {
                            AccountName: 'wpl-wrk-devtools-np',
                            AccountNumber: '403024778660',
                        },
                        NonProd: {
                            AccountName: 'wpl-wrk-devtools-np',
                            AccountNumber: '403024778660',
                        },
                    },
                    mockRequest,
                );
            } catch (error: any) {
                // Assert
                expect(error.message).toMatch(mockErrorMessage);
            }
        });
    });

    describe('findAll()', () => {
        it('can create permission on policy document at eventbridge if succesful', async () => {
            // Output
            const mockResult = JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Sid: 'EAI-EventBusPolicy_wpl-wrk',
                        Effect: 'Allow',
                        Principal: { AWS: 'arn:aws:iam::123456789111:root' },
                        Action: 'events:PutEvents',
                        Resource: 'arn:aws:events:ap-southeast-2:123456789112:event-bus/EAI-EventBus-AS',
                    },
                    {
                        Sid: 'wpl-wrk-devtools',
                        Effect: 'Allow',
                        Principal: { AWS: 'arn:aws:iam::123456789113:root' },
                        Action: 'events:PutEvents',
                        Resource: 'arn:aws:events:ap-southeast-2:123456789112:event-bus/EAI-EventBus-AS',
                    },
                ],
            });

            jest.spyOn(controller, 'findAll').mockImplementation(async () => mockResult);
            // Act
            const response = await controller.findAll(BrokerTypes.NP);

            // Assert
            expect(response).toEqual(mockResult);
        });

        it('Can return an error if exceptions are thrown', async () => {
            //Output
            const mockErrorMessage = 'test error message';
            jest.spyOn(controller, 'findAll').mockImplementation(async () => {
                throw new Error(mockErrorMessage);
            });

            //Act
            try {
                await controller.findAll(BrokerTypes.NP);
            } catch (error: any) {
                // Assert
                expect(error.message).toMatch(mockErrorMessage);
            }
        });
    });

    describe('remove()', () => {
        it('can remove permission on policy document at eventbridge if succesful', async () => {
            // Output
            const mockResult = {
                prodResult: {
                    $metadata: {
                        httpStatusCode: 200,
                        requestId: 'fc5b1fca-2bad-4ab6-9487-750e3ddbbd89',
                        attempts: 1,
                        totalRetryDelay: 0,
                    },
                },
                npResult: {
                    $metadata: {
                        httpStatusCode: 200,
                        requestId: 'ee82e8ce-b07f-4fa0-9a36-8a38e6c410fc',
                        attempts: 1,
                        totalRetryDelay: 0,
                    },
                },
            };

            jest.spyOn(controller, 'remove').mockImplementation(async () => mockResult);

            //Act
            const response = await controller.remove(
                { statementidPrd: 'wpl-wrk-devtools-prd', statementidNp: 'wpl-wrk-devtools-np' },
                mockRequest,
            );

            // Assert
            expect(response).toEqual(mockResult);
        });

        it('Can return an error if exceptions are thrown', async () => {
            //Output
            const mockErrorMessage = 'test error message';
            jest.spyOn(controller, 'remove').mockImplementation(async () => {
                throw new Error(mockErrorMessage);
            });

            //Act
            try {
                await controller.remove(
                    { statementidPrd: 'wpl-wrk-devtools-prd', statementidNp: 'wpl-wrk-devtools-np' },
                    mockRequest,
                );
            } catch (error: any) {
                // Assert
                expect(error.message).toMatch(mockErrorMessage);
            }
        });
    });
});
