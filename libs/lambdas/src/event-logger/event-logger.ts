import { WoodsideEvent } from '@eai-event-integration-platform/interfaces';
import { EventBridgeEvent, Context } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { LogLevel } from '@aws-lambda-powertools/logger/lib/types';

const logLevel = (process.env.LOG_LEVEL as LogLevel) ?? 'DEBUG';
const logger = new Logger({ serviceName: 'eventLogger', logLevel });

type LogEventPayload = {
    timestamp: string; // system time of SRE
    logOrigin: 'eai-event-broker' | 'eai-event-api' | 'eai-event-producer-adapter-sap'; // where the log was produced (e.g. SAPProducerAdapter, IntegrationPlatform, ARTConsumer)

    eventId: string; // producer event guid
    eventTime: string; // event time (detail.Metadata.Time)
    eventSource: string; // business domain e.g. wel.operations.maintenance
    eventDetailType: string; // event name e.g. WorkOrderStatusChange
    eventMetadataGuid: string; // from detail.Metadata.Guid
    eventMetadataTime: string; // from detail.Metadata.Time
    eventMetadataVersion: string | number; // from detail.Metadata.Version
    eventBus: string; // Integration event bus (EAI-EventBus-[DEV/QA/PRD])
    eventSize: string; // sizeOf(eventbridge event)
};

export const handler = async (event: EventBridgeEvent<string, WoodsideEvent>, context: Context) => {
    // All log statements are written to CloudWatch
    const timestamp = new Date();

    const data: LogEventPayload = {
        timestamp: timestamp.toISOString(),
        logOrigin: 'eai-event-broker',
        eventId: event.id,
        eventTime: event.time,
        eventSource: event.source,
        eventDetailType: event['detail-type'],
        eventMetadataGuid: event.detail.Metadata?.Guid || 'undefined',
        eventMetadataTime: event.detail.Metadata?.Time || 'undefined',
        eventMetadataVersion: event.detail.Metadata?.Version || 'undefined',
        eventBus: process.env.EVENTBUS_NAME || 'undefined',
        eventSize: JSON.stringify(event).length.toString(),
    };
    logger.addContext(context);
    logger.info('Event Received', { data });
    logger.debug('Event Payload', { event });

    return { statusCode: 200 };
};
