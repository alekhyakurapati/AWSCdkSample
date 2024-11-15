import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { ConfigService } from '@nestjs/config';
import { EventBridge, RemovePermissionCommandOutput } from '@aws-sdk/client-eventbridge';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';
import { BrokerTypes } from '@eai-event-integration-platform/interfaces';
import { STS } from '@aws-sdk/client-sts';

const ebMock = mockClient(EventBridge);
const stsMock = mockClient(STS);

describe('AdminService', () => {
    let service: AdminService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AdminService,
                {
                    provide: ConfigService,
                    useValue: {
                        getOrThrow: jest.fn((key: string) => ''),
                    },
                },
                { provide: EventBridge, useFactory: async () => new EventBridge({ region: 'ap-southeast-2' }) },
            ],
        }).compile();

        service = module.get<AdminService>(AdminService);

        ebMock.reset();
        stsMock.reset();
    });

    describe('create()', () => {
        it('can create permission on policy document at eventbridge if succesful', async () => {
            // Output
            const mockResult = {
                $metadata: {
                    httpStatusCode: 200,
                    requestId: 'fc5b1fca-2bad-4ab6-9487-750e3ddbbd89',
                    attempts: 1,
                    totalRetryDelay: 0,
                },
            };

            jest.spyOn(service, 'create').mockImplementation(async () => mockResult);

            //Act
            const response = await service.create(
                {
                    AccountName: 'wpl-wrk-devtools-np',
                    AccountNumber: '403024778660',
                },
                BrokerTypes.NP,
            );

            // Assert
            expect(response).toEqual(mockResult);
        });

        it('Can return an error if exceptions are thrown', async () => {
            //Output
            const mockErrorMessage = 'test error message';
            jest.spyOn(service, 'create').mockImplementation(async () => {
                throw new Error(mockErrorMessage);
            });

            //Act
            try {
                await service.create(
                    {
                        AccountName: 'wpl-wrk-devtools-np',
                        AccountNumber: '403024778660',
                    },
                    BrokerTypes.NP,
                );
            } catch (error: any) {
                // Assert
                expect(error.message).toMatch(mockErrorMessage);
            }
        });
    });

    describe('remove()', () => {
        it('can remove permission on policy document at eventbridge if succesful', async () => {
            // Output
            const mockResult: RemovePermissionCommandOutput = {
                $metadata: {
                    httpStatusCode: 200,
                    requestId: 'e56818d4-ef56-46d1-84ce-70390afbd296',
                    attempts: 1,
                    totalRetryDelay: 0,
                },
            };

            jest.spyOn(service, 'remove').mockImplementation(async () => mockResult);

            //Act
            const response = await service.remove('wpl-wrk-devtools-np', BrokerTypes.NP);

            // Assert
            expect(response).toEqual(mockResult);
        });

        it('Can return an error if exceptions are thrown', async () => {
            //Output
            const mockErrorMessage = 'test error message';
            jest.spyOn(service, 'remove').mockImplementation(async () => {
                throw new Error(mockErrorMessage);
            });

            //Act
            try {
                await service.remove('wpl-wrk-devtools-np', BrokerTypes.NP);
            } catch (error: any) {
                // Assert
                expect(error.message).toMatch(mockErrorMessage);
            }
        });
    });
});
