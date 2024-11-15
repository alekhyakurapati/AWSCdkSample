import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { EventStoreService } from './event-store.service';

describe('EventStoreService', () => {
    let service: EventStoreService;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                {
                    provide: ConfigService,
                    useValue: {
                        getOrThrow: jest.fn((key: string) => ''),
                    },
                },
                EventStoreService,
                {
                    provide: DynamoDB,
                    useValue: {},
                },
            ],
        }).compile();

        service = module.get(EventStoreService);
    });

    it('should be defined', () => {
        expect(service).toBeTruthy();
    });
});
