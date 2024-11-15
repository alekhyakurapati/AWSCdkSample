import { AzureADGuard, Role, Roles, RolesGuard } from '@eai-event-integration-platform/api/auth';
import { BrokerTypes, EventFailureFilterValues, PagedFailureMessage } from '@eai-event-integration-platform/interfaces';
import { Controller, DefaultValuePipe, Get, Logger, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { EventFailuresService } from './event-failures.service';

@Controller('event-failures')
@UseGuards(AzureADGuard, RolesGuard)
export class EventFailuresController {
    private readonly logger = new Logger(EventFailuresController.name);
    constructor(private eventFailuresService: EventFailuresService) {}

    @Get()
    @Roles(Role.Viewer)
    async listEventFailures(
        @Query('broker') broker: BrokerTypes,
        @Query('subscriberApplication') subscriberApplication: string,
        @Query('limit', new DefaultValuePipe(10), new ParseIntPipe()) limit: number,
        @Query('offset') offset?: string,
        @Query('subscriptionId') subscriptionId?: string,
        @Query('targetArn') targetArn?: string,
        @Query('startEventTimestamp') startEventTimestamp?: string,
        @Query('endEventTimestamp') endEventTimestamp?: string,
    ): Promise<PagedFailureMessage> {
        this.logger.debug('[listEventFailuress]');
        try {
            this.logger.debug(`Finding event failures`);
            return await this.eventFailuresService.listEventFailures(
                broker,
                subscriberApplication,
                limit,
                offset,
                subscriptionId,
                targetArn,
                startEventTimestamp,
                endEventTimestamp,
            );
        } catch (error: any) {
            this.logger.error(`Error listing event failures: ${error.message}`);
            throw error;
        }
    }

    @Get('filter-values')
    @Roles(Role.Viewer)
    async listFilterValues(
        @Query('broker') broker: BrokerTypes,
        @Query('subscriberApplication') subscriberApplication: string,
    ): Promise<EventFailureFilterValues> {
        this.logger.debug(`Finding filter values`);
        try {
            this.logger.debug(`Finding Event Failure Filters`);
            return await this.eventFailuresService.listFilterValues(broker, subscriberApplication);
        } catch (error: any) {
            this.logger.error(`Error listing filter values: ${error.message}`);
            throw error;
        }
    }
}
