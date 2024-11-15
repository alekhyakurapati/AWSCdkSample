import { Module } from '@nestjs/common';

import { AwsModule } from '@eai-event-integration-platform/api/aws';

import { EventStoreService } from './event-store.service';
import { StateChangedListener } from './listeners/state-changed.listener';

@Module({
    imports: [AwsModule],
    providers: [EventStoreService, StateChangedListener],
    exports: [EventStoreService],
})
export class EventsModule {}
