import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventStoreService } from '../event-store.service';
import { StateChangedEvent } from '../events/state-changed.event';

@Injectable()
export class StateChangedListener {
    private readonly logger = new Logger(StateChangedListener.name);

    constructor(private eventStore: EventStoreService) {}

    @OnEvent('state-change.requested')
    handleStateChangedEvent(event: StateChangedEvent) {
        // handle and process "StateChangedEvent" event
        // this.logger.debug(`Stage Change Requested: ${event.name}: ${JSON.stringify(event.data, null, 2)}`);
        this.eventStore
            .addToEventStore(event.name, event.data, event.username)
            .catch((err) => this.logger.error('Error writing event to eventstore:' + err));
    }
}
