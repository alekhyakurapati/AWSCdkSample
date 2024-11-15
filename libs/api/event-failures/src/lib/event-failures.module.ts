import { Module } from '@nestjs/common';

import { AwsModule } from '@eai-event-integration-platform/api/aws';

import { EventFailuresController } from './event-failures.controller';
import { EventFailuresRepository } from './event-failures.repository';
import { EventFailuresService } from './event-failures.service';

@Module({
    imports: [AwsModule, EventFailuresModule],
    controllers: [EventFailuresController],
    providers: [EventFailuresService, EventFailuresRepository],
    exports: [EventFailuresService],
})
export class EventFailuresModule {}
