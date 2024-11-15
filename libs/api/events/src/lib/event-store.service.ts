import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DynamoDB, PutItemCommandInput } from '@aws-sdk/client-dynamodb';

@Injectable()
export class EventStoreService {
    tableName: string;

    constructor(private configService: ConfigService, private readonly ddb: DynamoDB) {
        this.tableName = configService.getOrThrow<string>('DDB_EVENT_STORE_TABLE_NAME') as string;
    }

    addToEventStore = (name: string, data: any, username: string) => {
        const params: PutItemCommandInput = {
            TableName: this.tableName,
            Item: {
                event: { S: name },
                username: { S: username },
                created: { S: new Date().toISOString() },
                data: { S: JSON.stringify(data) },
            },
        };

        return this.ddb.putItem(params);
    };
}
