import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DynamoDBDocument, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { STS } from '@aws-sdk/client-sts';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';
import { AwsService } from '@eai-event-integration-platform/api/aws';
import { Domain } from '@eai-event-integration-platform/interfaces';
import { DomainsService } from './domains.service';

const stsMock = mockClient(STS);
const ddbMock = mockClient(DynamoDBDocument);
const items = [
    {
        PK: 'wel',
        Path: 'wel',
        Name: 'wel',
        DisplayName: 'wel',
    },
    {
        PK: 'wel',
        Path: 'wel.climate-strategy',
        Name: 'climate-strategy',
        DisplayName: 'Climate Strategy',
    },
    {
        PK: 'wel',
        Path: 'wel.climate-strategy.carbon',
        Name: 'carbon',
        DisplayName: 'Carbon',
    },
    {
        PK: 'wel',
        Path: 'wel.corporate-legal',
        Name: 'corporate-legal',
        DisplayName: 'Corporate & Legal',
    },
    {
        PK: 'wel',
        Path: 'wel.corporate-legal.business-climate-energy-outlook',
        Name: 'business-climate-energy-outlook',
        DisplayName: 'Business Climate & Energy Outlook',
    },
    {
        PK: 'wel',
        Path: 'wel.corporate-legal.corporate-change-management',
        Name: 'corporate-change-management',
        DisplayName: 'Corporate Change Management',
    },
] as Domain[];

describe('DomainsService', () => {
    let service: DomainsService;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                DomainsService,
                AwsService,
                {
                    provide: ConfigService,
                    useValue: {
                        getOrThrow: jest.fn((key: string) => ''),
                    },
                },
                {
                    provide: STS,
                    useFactory: async () => new STS({ region: 'ap-southeast-2' }),
                },
                {
                    provide: DynamoDBDocument,
                    useFactory: async () => DynamoDBDocument.from(new DynamoDB({ region: 'ap-southeast-2' })),
                },
            ],
        }).compile();

        service = module.get(DomainsService);

        stsMock.reset();
        ddbMock.reset();
    });

    it('should be defined', () => {
        expect(service).toBeTruthy();
    });

    it('domains() should return a flat array/list of domains', async () => {
        // Arrange
        ddbMock.on(QueryCommand).resolves({
            $metadata: {},
            ConsumedCapacity: undefined,
            Count: 44,
            ScannedCount: 44,
            LastEvaluatedKey: undefined,
            Items: items,
        });

        // Act
        const result = await service.domains();

        // Assert
        expect(result).toEqual(items);
    });

    it('tree() should return a tree structure of domains', async () => {
        // Arrange
        ddbMock.on(QueryCommand).resolves({
            $metadata: {},
            ConsumedCapacity: undefined,
            Count: 44,
            ScannedCount: 44,
            LastEvaluatedKey: undefined,
            Items: items,
        });

        // Act
        const result = await service.tree();
        console.log('result', result);

        // Assert
        expect(result).toEqual([
            {
                Path: 'wel.climate-strategy',
                Name: 'climate-strategy',
                DisplayName: 'Climate Strategy',
                PK: 'wel',
                Children: [
                    {
                        Path: 'wel.climate-strategy.carbon',
                        Name: 'carbon',
                        DisplayName: 'Carbon',
                        PK: 'wel',
                    },
                ],
            },
            {
                Path: 'wel.corporate-legal',
                Name: 'corporate-legal',
                DisplayName: 'Corporate & Legal',
                PK: 'wel',
                Children: [
                    {
                        Path: 'wel.corporate-legal.business-climate-energy-outlook',
                        Name: 'business-climate-energy-outlook',
                        DisplayName: 'Business Climate & Energy Outlook',
                        PK: 'wel',
                    },
                    {
                        Path: 'wel.corporate-legal.corporate-change-management',
                        Name: 'corporate-change-management',
                        DisplayName: 'Corporate Change Management',
                        PK: 'wel',
                    },
                ],
            },
        ]);
    });
});
