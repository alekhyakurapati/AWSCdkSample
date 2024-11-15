import { Schemas } from '@aws-sdk/client-schemas';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { SchemasInfrastructure } from './schemas.infrastructure';

describe('SchemasInfrastructure', () => {
    let service: SchemasInfrastructure;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                {
                    provide: ConfigService,
                    useValue: {
                        getOrThrow: jest.fn((key: string) => {
                            switch (key) {
                                case 'SCHEMA_REGISTRY_NAME':
                                    return 'EAI-SchemaRegistry-TEST';
                                default:
                                    throw new Error(`Unknown config value ${key}`);
                            }
                        }),
                    },
                },
                {
                    provide: Schemas,
                    useFactory: async () => new Schemas({ region: 'ap-southeast-2' }),
                },
                SchemasInfrastructure,
            ],
        }).compile();

        service = module.get<SchemasInfrastructure>(SchemasInfrastructure);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
