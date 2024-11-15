import { Module } from '@nestjs/common';

import { AwsModule } from '@eai-event-integration-platform/api/aws';
import { SubscriptionsModule } from '@eai-event-integration-platform/api/subscriptions';

import { SchemasController } from './schemas.controller';
import { SchemasService } from './schemas.service';
import { SchemasInfrastructure } from './schemas.infrastructure';
import { SchemasRepository } from './schemas.repository';

@Module({
    imports: [AwsModule, SubscriptionsModule],
    controllers: [SchemasController],
    providers: [SchemasService, SchemasInfrastructure, SchemasRepository],
    exports: [SchemasService],
})
export class SchemasModule {}
