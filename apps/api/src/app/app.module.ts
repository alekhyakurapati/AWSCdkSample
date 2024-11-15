import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import Joi from 'joi';

import { AuthModule } from '@eai-event-integration-platform/api/auth';
import { DomainsModule } from '@eai-event-integration-platform/api/domains';
import { EventsModule } from '@eai-event-integration-platform/api/events';
import { SchemasModule } from '@eai-event-integration-platform/api/schemas';
import { SubscriptionsModule } from '@eai-event-integration-platform/api/subscriptions';
import { AwsModule } from '@eai-event-integration-platform/api/aws';
import { AdminModule } from '@eai-event-integration-platform/api/admin';
import { ApplicationsModule } from '@eai-event-integration-platform/api/applications';
import { EventFailuresModule } from '@eai-event-integration-platform/api/event-failures';
import { UtilsModule } from '@eai-event-integration-platform/api/utils';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
    imports: [
        ConfigModule.forRoot({
            ignoreEnvFile: process.env.NODE_ENV === 'production',
            isGlobal: true,
            validationSchema: Joi.object({
                NODE_ENV: Joi.string().valid('development', 'production', 'qa').default('development'),
                SCHEMA_REGISTRY_NAME: Joi.string().required(),
                EVENT_BUS_ARN: Joi.string().required(),
                EVENT_BUS_ARN_NP: Joi.string().required(),
                DLQ_ARN: Joi.string().required(),
                DLQ_ARN_NP: Joi.string().required(),
                INVOKE_API_DEST_ROLE_ARN: Joi.string().required(),
                INVOKE_API_DEST_ROLE_ARN_NP: Joi.string().required(),
                DDB_EVENT_STORE_TABLE_NAME: Joi.string().required(),
                DDB_DOMAINS_TABLE_NAME: Joi.string().required(),
                DDB_SUBSCRIPTIONS_TABLE_NAME: Joi.string().required(),
                DDB_APPLICATIONS_TABLE_NAME: Joi.string().required(),
                DDB_SCHEMAS_TABLE_NAME: Joi.string().required(),
                AZURE_CLIENT_ID: Joi.string().required(),
                AZURE_TENANT_ID: Joi.string().default('a3299bba-ade6-4965-b011-bada8d1d9558'),
                DDB_EVENT_FAILURES_TABLE_NAME_NP: Joi.string().required(),
                DDB_EVENT_FAILURES_TABLE_NAME_PRD: Joi.string().required(),
                PUT_EVENT_BUS_DEST_ROLE_ARN: Joi.string().required(),
                PUT_EVENT_BUS_DEST_ROLE_ARN_NP: Joi.string().required(),
            }),
        }),
        UtilsModule,
        AwsModule,
        EventEmitterModule.forRoot(),
        AuthModule,
        DomainsModule,
        EventsModule,
        SchemasModule,
        SubscriptionsModule,
        AdminModule,
        ApplicationsModule,
        EventFailuresModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
