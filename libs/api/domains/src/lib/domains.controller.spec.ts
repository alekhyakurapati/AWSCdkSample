import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { STS } from '@aws-sdk/client-sts';
import { AwsService } from '@eai-event-integration-platform/api/aws';
import { Domain } from '@eai-event-integration-platform/interfaces';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DomainsController } from './domains.controller';
import { DomainsService } from './domains.service';

describe('DomainsController', () => {
    let controller: DomainsController;
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
            controllers: [DomainsController],
        }).compile();

        controller = module.get(DomainsController);
        service = await module.resolve(DomainsService);
    });

    it('should be defined', () => {
        expect(controller).toBeTruthy();
    });

    it('domains()', async () => {
        // Arrange
        const mockResult = [
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

        jest.spyOn(service, 'domains').mockImplementation(async () => mockResult);

        // Act
        const response = await controller.findBusinessDomains();

        // Assert
        expect(response).toEqual(mockResult);
    });

    it('tree()', async () => {
        // Arrange
        const mockResult = [
            {
                Path: 'wel.climate-strategy',
                Name: 'climate-strategy',
                DisplayName: 'Climate Strategy',
                Children: [
                    {
                        Path: 'wel.climate-strategy.carbon',
                        Name: 'carbon',
                        DisplayName: 'Carbon',
                    },
                ],
            },
            {
                Path: 'wel.corporate-legal',
                Name: 'corporate-legal',
                DisplayName: 'Corporate & Legal',
                Children: [
                    {
                        Path: 'wel.corporate-legal.business-climate-energy-outlook',
                        Name: 'business-climate-energy-outlook',
                        DisplayName: 'Business Climate & Energy Outlook',
                    },
                    {
                        Path: 'wel.corporate-legal.corporate-change-management',
                        Name: 'corporate-change-management',
                        DisplayName: 'Corporate Change Management',
                    },
                ],
            },
        ] as Domain[];

        jest.spyOn(service, 'tree').mockImplementation(async () => mockResult);

        // Act
        const response = await controller.findBusinessDomainTree();

        // Assert
        expect(response).toEqual(mockResult);
    });
});
