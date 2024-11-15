import { Module } from '@nestjs/common';

import { AwsModule } from '@eai-event-integration-platform/api/aws';
import { SubscriptionsModule } from '@eai-event-integration-platform/api/subscriptions';
import { SchemasModule } from '@eai-event-integration-platform/api/schemas';
import { UtilsModule } from '@eai-event-integration-platform/api/utils';

import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { ApplicationsRepository } from './applications.repository';

@Module({
    imports: [AwsModule, SubscriptionsModule, SchemasModule, UtilsModule],
    controllers: [ApplicationsController],
    providers: [ApplicationsService, ApplicationsRepository],
    exports: [ApplicationsService],
})
export class ApplicationsModule {}
