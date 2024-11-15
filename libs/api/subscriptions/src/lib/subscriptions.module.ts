import { Module } from '@nestjs/common';

import { AwsModule } from '@eai-event-integration-platform/api/aws';

import { RestTargetsController } from './controller/rest-targets.controller';
import { SubscriptionsController } from './subscriptions.controller';
import { RestTargetsService } from './service/rest-targets.service';
import { RestTargetsInfrastructure } from './infrastructure/rest-targets.infrastructure';
import { RestTargetsRepository } from './repository/rest-targets.repository';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsInfrastructure } from './subscriptions.infrastructure';
import { SubscriptionsRepository } from './subscriptions.repository';

@Module({
    imports: [AwsModule],
    controllers: [SubscriptionsController, RestTargetsController],
    providers: [
        SubscriptionsService,
        SubscriptionsInfrastructure,
        SubscriptionsRepository,
        RestTargetsService,
        RestTargetsInfrastructure,
        RestTargetsRepository,
    ],
    exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
