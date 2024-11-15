import { DynamoDBServiceException } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument, QueryCommandInput, QueryCommandOutput } from '@aws-sdk/lib-dynamodb';
import {
    BrokerTypes,
    EvaluatedKey,
    EventFailureFilterValues,
    FailureMessage,
    PagedFailureMessage,
} from '@eai-event-integration-platform/interfaces';
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EventFailuresRepository {
    private readonly logger = new Logger(EventFailuresRepository.name);
    npTableName: string;
    prdTableName: string;
    constructor(public ddbDoc: DynamoDBDocument, private configService: ConfigService) {
        this.npTableName = configService.getOrThrow<string>('DDB_EVENT_FAILURES_TABLE_NAME_NP');
        this.prdTableName = configService.getOrThrow<string>('DDB_EVENT_FAILURES_TABLE_NAME_PRD');
    }

    // get all event failures
    async listEventFailures(
        broker: BrokerTypes,
        subscriberApplication: string,
        limit: number,
        offset?: string,
        subscriptionId?: string,
        targetArn?: string,
        startEventTimestamp?: string,
        endEventTimestamp?: string,
    ) {
        try {
            // Get Event failures data from DDB
            const params: QueryCommandInput = {
                TableName: broker == BrokerTypes.NP ? this.npTableName : this.prdTableName,
                IndexName: 'EventFailuresTableIndexOnSubscriberApp',
                KeyConditionExpression: '#PK = :pk',
                ExpressionAttributeNames: { '#PK': 'SubscriberApp' },
                ExpressionAttributeValues: { ':pk': subscriberApplication },
                ScanIndexForward: false,
                Limit: limit,
            };

            // Date range filter
            if ((startEventTimestamp === undefined) !== (endEventTimestamp === undefined)) {
                throw new Error(
                    'Both startEventTimestamp and endEndTimestamp must be provided, or both must be undefined',
                );
            }

            if (startEventTimestamp && endEventTimestamp) {
                params.KeyConditionExpression += ' AND #SK BETWEEN :startEventTimestamp AND :endEventTimestamp';
                params.ExpressionAttributeNames = {
                    ...params.ExpressionAttributeNames,
                    '#SK': 'EventTimestamp',
                };
                params.ExpressionAttributeValues = {
                    ...params.ExpressionAttributeValues,
                    ':startEventTimestamp': startEventTimestamp,
                    ':endEventTimestamp': endEventTimestamp,
                };
            }

            const results = [];

            let filterResult: QueryCommandOutput;

            if (offset) {
                const evaluatedKeys: EvaluatedKey = JSON.parse(offset);
                params.ExclusiveStartKey = {
                    EventTimestamp: evaluatedKeys.EventTimestamp,
                    SK: evaluatedKeys.SK,
                    PK: evaluatedKeys.PK,
                    SubscriberApp: evaluatedKeys.SubscriberApp,
                };
            }

            // Filtering
            if (subscriptionId || targetArn) {
                const nonKeyFilters = [];
                if (subscriptionId) {
                    nonKeyFilters.push(`#SubscriptionId=:subscriptionId`);
                    params.ExpressionAttributeNames = {
                        ...params.ExpressionAttributeNames,
                        '#SubscriptionId': 'SubscriptionId',
                    };
                    params.ExpressionAttributeValues = {
                        ...params.ExpressionAttributeValues,
                        ':subscriptionId': subscriptionId,
                    };
                }
                if (targetArn) {
                    nonKeyFilters.push(`#TargetArn=:targetArn`);
                    params.ExpressionAttributeNames = {
                        ...params.ExpressionAttributeNames,
                        '#TargetArn': 'TargetArn',
                    };
                    params.ExpressionAttributeValues = {
                        ...params.ExpressionAttributeValues,
                        ':targetArn': targetArn,
                    };
                }
                params.FilterExpression = nonKeyFilters.join(' AND ');
                do {
                    this.logger.log(`Fetching from start key: ${params.ExclusiveStartKey}`);
                    filterResult = await this.ddbDoc.query(params);
                    params.ExclusiveStartKey = filterResult.LastEvaluatedKey;

                    if (filterResult.Items) {
                        for (const item of filterResult.Items) {
                            if (results.length < limit) {
                                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                const { PK, SK, ...rest } = item;
                                results.push(rest as FailureMessage);
                            } else {
                                params.ExclusiveStartKey = {
                                    PK: item.PK,
                                    SK: item.SK,
                                };
                            }
                        }
                    }
                } while (results.length < limit && filterResult.LastEvaluatedKey);
                const pagedFailureMessage: PagedFailureMessage = {
                    Data: results as FailureMessage[],
                    Offset: params.ExclusiveStartKey,
                };
                this.logger.log('pagedFailureMessage: ', JSON.stringify(pagedFailureMessage));

                return pagedFailureMessage;
            } else {
                // Retrieve event failures without filters
                this.logger.log('Query parameters without filter: ', JSON.stringify(params)), this.npTableName;
                const result = await this.ddbDoc.query(params);
                this.logger.log('QueryCommandOutput:', JSON.stringify(result));
                // remove PK and SK from return object
                const itemData: FailureMessage[] = [];
                result.Items?.forEach((item) => {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { PK, SK, ...rest } = item;
                    itemData.push(rest as FailureMessage);
                });
                // Set return object
                const pagedFailureMessage: PagedFailureMessage = {
                    Data: itemData,
                    Offset: result.LastEvaluatedKey,
                };
                this.logger.log('pagedFailureMessage: ', JSON.stringify(result));

                return pagedFailureMessage;
            }
        } catch (error: unknown) {
            if (error instanceof DynamoDBServiceException) {
                throw new InternalServerErrorException(error.message);
            }
            throw new InternalServerErrorException(error);
        }
    }

    // Cannot fetch more than 1MB of data as it leads to WCU/RCU exceeding the limits
    async listFilterValues(broker: BrokerTypes, subscriberApplication: string): Promise<EventFailureFilterValues> {
        try {
            // Get Event failures data from DDB

            const params: QueryCommandInput = {
                TableName: broker == BrokerTypes.NP ? this.npTableName : this.prdTableName,
                IndexName: 'EventFailuresTableIndexOnSubscriberApp',
                KeyConditionExpression: '#PK = :pk',
                ExpressionAttributeNames: { '#PK': 'SubscriberApp' },
                ExpressionAttributeValues: { ':pk': subscriberApplication },
            };

            const result = await this.ddbDoc.query(params);

            this.logger.log('QueryCommandOutput: ', JSON.stringify(result));

            if (!result.Items) {
                return {
                    SubscriptionIds: [],
                    TargetArns: [],
                };
            }
            const subscriptionIds = new Set();
            const targetArns = new Set();
            for (const item of result.Items) {
                subscriptionIds.add(getRuleNameFromArn(item.RuleArn));
                targetArns.add(item.TargetArn);
            }

            const filterValues: EventFailureFilterValues = {
                SubscriptionIds: Array.from(subscriptionIds) as string[],
                TargetArns: Array.from(targetArns) as string[],
            };

            this.logger.log('filterValues: ', JSON.stringify(filterValues));

            return filterValues;
        } catch (error: unknown) {
            if (error instanceof DynamoDBServiceException) {
                throw new InternalServerErrorException(error.message);
            }
            throw new InternalServerErrorException(error);
        }
    }
}

function getRuleNameFromArn(arnName: string) {
    const ruleRegExp =
        /^arn:aws[\w-]*:events:[a-z]{2}-[a-z]+-[\w-]+:[0-9]{12}:[a-zA-Z-]+\/[.\-_A-Za-z0-9]+(\/(?<ruleName>[a-zA-Z.0-9-]+))?/;

    const result = ruleRegExp.exec(arnName);
    let ruleName = '';
    if (result && result.groups) {
        ruleName = result.groups.ruleName;
    }
    return ruleName;
}
