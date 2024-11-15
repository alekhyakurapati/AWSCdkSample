import { CloudWatchLogsClient } from '@aws-sdk/client-cloudwatch-logs';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { EventBridge } from '@aws-sdk/client-eventbridge';
import { Schemas } from '@aws-sdk/client-schemas';
import { STS } from '@aws-sdk/client-sts';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { Module, Scope } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';

import { AwsExceptionFilter } from './aws-exception.filter';
import { AwsService } from './aws.service';
const localDb = false;

@Module({
    imports: [ConfigModule],
    controllers: [],
    providers: [
        AwsService,
        {
            provide: APP_FILTER,
            useClass: AwsExceptionFilter,
        },
        {
            provide: CloudWatchLogsClient,
            useFactory: async () => new CloudWatchLogsClient({ region: 'ap-southeast-2' }),
        },
        {
            provide: DynamoDB,
            useFactory: async () =>
                localDb
                    ? new DynamoDB({ region: 'localhost', endpoint: 'http://localhost:8000' })
                    : new DynamoDB({ region: 'ap-southeast-2' }),
        },
        {
            provide: DynamoDBDocument,
            useFactory: async () => {
                return DynamoDBDocument.from(new DynamoDB({ region: 'ap-southeast-2' }));
            },
            // configures a new instance of Dynamodb Document on each request
            // this clears the session that the client may need to assume role
            scope: Scope.REQUEST,
        },
        {
            provide: EventBridge,
            useFactory: async () => new EventBridge({ region: 'ap-southeast-2' }),
            // configures a new instance of EventBridge Client on each request
            // this clears the session that the client may need to assume role
            scope: Scope.REQUEST,
        },
        {
            provide: Schemas,
            useFactory: async () => new Schemas({ region: 'ap-southeast-2' }),
        },
        {
            provide: STS,
            useFactory: async () => new STS({ region: 'ap-southeast-2' }),
        },
    ],
    exports: [AwsService, CloudWatchLogsClient, DynamoDB, DynamoDBDocument, EventBridge, Schemas, STS],
})
export class AwsModule {}
