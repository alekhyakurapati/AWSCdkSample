import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { AwsService } from '@eai-event-integration-platform/api/aws';
import { BrokerTypes, EventFailureFilterValues } from '@eai-event-integration-platform/interfaces';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventFailuresRepository } from './event-failures.repository';

@Injectable()
export class EventFailuresService {
    private readonly logger = new Logger(EventFailuresService.name);

    constructor(
        private eventFailuresRepository: EventFailuresRepository,
        private configService: ConfigService,
        private awsService: AwsService,
    ) {}

    async listEventFailures(
        broker: BrokerTypes,
        subscriberApplication: string,
        limit: number,
        offset?: string,
        subscriptionId?: string,
        targetArn?: string,
        startEventTimestamp?: string,
        endEventTimestamp?: string,
    ) {
        await this.checkEnvironment(broker);
        return this.eventFailuresRepository.listEventFailures(
            broker,
            subscriberApplication,
            limit,
            offset,
            subscriptionId,
            targetArn,
            startEventTimestamp,
            endEventTimestamp,
        );
    }

    async listFilterValues(broker: BrokerTypes, subscriberApplication: string): Promise<EventFailureFilterValues> {
        await this.checkEnvironment(broker);
        return this.eventFailuresRepository.listFilterValues(broker, subscriberApplication);
    }

    private async checkEnvironment(broker: BrokerTypes) {
        this.logger.debug('[checkEnvironment]');
        const env = this.configService.getOrThrow('NODE_ENV');
        this.logger.log(`broker data in check env', ${env}, ${broker}, 'broker check:', ${broker == BrokerTypes.NP}`);
        if ((env === 'production' || env === 'qa') && broker === BrokerTypes.NP) {
            // nonProd broker being requested, need to assume new role for non-prod aws account
            await this.setNpDynamoDbClient();
        }
    }

    private async setNpDynamoDbClient() {
        this.logger.debug('[setNpDynamoDbClient]');
        try {
            const creds = await this.awsService.assumeNonProdRole();
            const ddb = new DynamoDB({
                region: 'ap-southeast-2',
                credentials: {
                    accessKeyId: creds.AccessKeyId + '',
                    secretAccessKey: creds.SecretAccessKey + '',
                    sessionToken: creds.SessionToken,
                },
            });
            this.eventFailuresRepository.ddbDoc = DynamoDBDocument.from(ddb);
        } catch (error: any) {
            this.logger.error(`Error trying to set DynamoDbClient to assume NonProd Role: ${error.message}`);
            throw error;
        }
    }
}
