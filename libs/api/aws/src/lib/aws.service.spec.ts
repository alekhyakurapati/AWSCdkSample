import { STS } from '@aws-sdk/client-sts';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';
import { AwsService } from './aws.service';

const stsMock = mockClient(STS);

describe('AwsService', () => {
    let service: AwsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AwsService,
                {
                    provide: ConfigService,
                    useValue: {
                        getOrThrow: jest.fn((key: string) => ''),
                    },
                },
                { provide: STS, useFactory: async () => new STS({ region: 'ap-southeast-2' }) },
            ],
        }).compile();

        service = module.get<AwsService>(AwsService);

        stsMock.reset();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
