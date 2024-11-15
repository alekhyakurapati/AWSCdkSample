import { EventBridge, PutPermissionCommandInput, RemovePermissionCommandInput } from '@aws-sdk/client-eventbridge';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { PublisherDetails } from './dto/create-permission.dto';
import { BrokerTypes } from '@eai-event-integration-platform/interfaces';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminService {
    private readonly logger = new Logger(AdminService.name);
    private eventBusNameNp?: string;
    private eventBusName?: string;

    constructor(
        private configService: ConfigService,
        public eventBridge: EventBridge, // public to allow setting during runtime
    ) {
        this.eventBusNameNp = configService.getOrThrow<string>('EVENT_BUS_NAME_NP');
        this.eventBusName = configService.getOrThrow<string>('EVENT_BUS_NAME');
    }

    async create(publisherDetails: PublisherDetails, brokerTypes: BrokerTypes) {
        this.logger.debug('[create]');
        this.logger.log(`Creating new permission for (${publisherDetails.AccountName}) in AWS`);
        const params: PutPermissionCommandInput = {
            StatementId: publisherDetails.AccountName,
            EventBusName: this.getEventBusName(brokerTypes),
            Action: 'events:PutEvents',
            Principal: publisherDetails.AccountNumber,
        };
        this.logger.log(' Putting Permission with params' + JSON.stringify(params));
        const result = await this.eventBridge.putPermission(params);
        console.log('PutPermission result', JSON.stringify(result));
        return result;
    }

    async findAll(brokerTypes: BrokerTypes) {
        const params = {
            Name: this.getEventBusName(brokerTypes),
        };
        const { Policy } = await this.eventBridge.describeEventBus(params);
        return Policy;
    }

    async remove(statementId: string, broker: BrokerTypes) {
        this.logger.debug('[delete]');
        this.logger.log(`Removing a permission for ${statementId} in AWS`);
        const params: RemovePermissionCommandInput = {
            StatementId: statementId,
            EventBusName: this.getEventBusName(broker),
        };
        this.logger.log(' Removing Permission with params' + JSON.stringify(params));
        const result = await this.eventBridge.removePermission(params);
        console.log('Remove permission result', JSON.stringify(result));
        return result;
    }

    private getEventBusName(broker: BrokerTypes) {
        return broker.toUpperCase() === BrokerTypes.NP ? this.eventBusNameNp : this.eventBusName;
    }
}
