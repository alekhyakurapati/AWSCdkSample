import { DynamoDBDocument, QueryCommandInput } from '@aws-sdk/lib-dynamodb';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Domain } from '@eai-event-integration-platform/interfaces';

@Injectable()
export class DomainsService {
    private readonly logger = new Logger(DomainsService.name);
    private tableName?: string;

    constructor(private configService: ConfigService, private ddb: DynamoDBDocument) {
        this.tableName = this.configService.getOrThrow<string>('DDB_DOMAINS_TABLE_NAME') as string;
    }
    /**
     * Finds all domains for a given prefix
     */
    async domains(): Promise<Domain[]> {
        this.logger.debug('[domains]');
        const params: QueryCommandInput = {
            TableName: this.tableName,
            KeyConditionExpression: '#partitionKeyName=:partitionkeyval',
            ExpressionAttributeNames: { '#partitionKeyName': 'PK' },
            ExpressionAttributeValues: { ':partitionkeyval': 'wel' },
        };

        const queryResult = await this.ddb.query(params);
        return queryResult.Items.length ? (queryResult.Items as Domain[]) : [];
    }

    /**
     * Finds domain tree structure for given prefix
     */
    async tree(): Promise<Domain[]> {
        this.logger.debug('[tree]');
        const domainArray = await this.domains();
        const map: any = {};
        let parent: string[] = [''];
        let parentString = '';
        for (let i = 0; i < domainArray.length; i++) {
            map[domainArray[i].Path] = { ...domainArray[i] };
        }
        for (let j = 0; j < domainArray.length; j++) {
            const node: Domain = {
                Path: '',
                Name: '',
                DisplayName: '',
            };
            node.Path = domainArray[j].Path;
            parent = node.Path.split('.');
            parent.pop();
            if (parent.length !== 0) {
                parentString = parent.join('.');
                map[parentString].Children = map[parentString].Children || [];
                map[parentString].Children.push(map[node.Path]);
            } else {
                map[node.Path];
            }
        }
        return map['wel'] ? map['wel'].Children : [];
    }
}
