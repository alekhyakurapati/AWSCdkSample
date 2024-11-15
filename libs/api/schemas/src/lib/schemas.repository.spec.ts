import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { SchemasRepository } from './schemas.repository';

describe('SchemasRepository', () => {
    let service: SchemasRepository;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                {
                    provide: ConfigService,
                    useValue: {
                        getOrThrow: jest.fn((key: string) => {
                            switch (key) {
                                case 'DDB_SCHEMAS_TABLE_NAME':
                                    return 'EAI-EventApiStack-TEST-SchemasTable-';
                                default:
                                    throw new Error(`Unknown config value ${key}`);
                            }
                        }),
                    },
                },
                {
                    provide: DynamoDBDocument,
                    useFactory: async () => DynamoDBDocument.from(new DynamoDB({ region: 'ap-southeast-2' })),
                },
                SchemasRepository,
            ],
        }).compile();

        service = module.get<SchemasRepository>(SchemasRepository);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
