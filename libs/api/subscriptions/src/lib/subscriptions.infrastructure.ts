import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    EventBridge,
    EventBridgeServiceException,
    ListTargetsByRuleCommandInput,
    PutRuleCommandInput,
    PutTargetsCommandInput,
    RemoveTargetsCommandInput,
    Target,
} from '@aws-sdk/client-eventbridge';
import { BrokerTypes, Subscription } from '@eai-event-integration-platform/interfaces';
import { randomUUID } from 'crypto';

@Injectable()
export class SubscriptionsInfrastructure {
    private readonly logger = new Logger(SubscriptionsInfrastructure.name);
    private eventBusName: string;
    private eventBusNameNp: string;
    private dlqArn: string;
    private dlqArnNp: string;
    private invokeApiDestRoleArn: string;
    private invokeApiDestRoleArnNp: string;
    private putEventBusDestRoleArn: string;
    private putEventBusDestRoleArnNp: string;

    constructor(public eventBridge: EventBridge, private configService: ConfigService) {
        // event bus arn can be used for subscriptions even though the key is named EventBusName
        this.eventBusName = configService.getOrThrow<string>('EVENT_BUS_ARN');
        this.eventBusNameNp = configService.getOrThrow<string>('EVENT_BUS_ARN_NP');
        this.dlqArn = configService.getOrThrow<string>('DLQ_ARN');
        this.dlqArnNp = configService.getOrThrow<string>('DLQ_ARN_NP');
        this.invokeApiDestRoleArn = configService.getOrThrow<string>('INVOKE_API_DEST_ROLE_ARN');
        this.invokeApiDestRoleArnNp = configService.getOrThrow<string>('INVOKE_API_DEST_ROLE_ARN_NP');
        this.putEventBusDestRoleArn = configService.getOrThrow<string>('PUT_EVENT_BUS_DEST_ROLE_ARN');
        this.putEventBusDestRoleArnNp = configService.getOrThrow<string>('PUT_EVENT_BUS_DEST_ROLE_ARN_NP');
    }

    async createSubscription(subscription: Subscription): Promise<Subscription> {
        this.logger.debug('[createSubscription]');
        try {
            // attempt to create Rule
            subscription.EventBusName = this.getEventBusName(subscription.Broker);
            this.logger.log(`Creating rule ${subscription.Name} on eventbus ${subscription.EventBusName}`);
            const ruleArn = await this.saveRule(subscription);

            this.logger.log(`Creating targets on rule`);
            const targets = await this.addTargets(
                subscription.Targets,
                subscription.Name,
                subscription.EventBusName,
                subscription.Broker,
            );

            // Add the RuleArn and targetArns (as some would get dropped if multiple were requested for prod)
            return {
                ...subscription,
                RuleArn: ruleArn,
                Targets: targets.map((t) => t.Arn + ''),
            };
        } catch (error: unknown) {
            // in case the error happened on the create target command, we need to delete the rule
            this.logger.error(`Error creating target for rule: ${JSON.stringify(error)}. Deleting rule`);
            this.eventBridge.deleteRule({
                Name: subscription.Name,
                EventBusName: subscription.EventBusName,
            });

            if (error instanceof EventBridgeServiceException) {
                if (error.name === 'AccessDeniedException') {
                    const targetArns = subscription.Targets?.join(',');
                    throw new ForbiddenException(
                        `Please ensure the target Eventbus: ${targetArns} exists and have the right resource based policies configured.`,
                    );
                }
            }
            throw new InternalServerErrorException(error);
        }
    }

    async deleteSubscription(subscription: Subscription): Promise<Subscription> {
        this.logger.debug('[deleteSubscription]');
        try {
            // attempt to delete Rule
            subscription.EventBusName = this.getEventBusName(subscription.Broker);

            const currentTargets = await this.listTargetsByRule(subscription.Name, subscription.EventBusName);
            const currentTargetIds = currentTargets ? currentTargets.map((ct) => ct.Id!) : [];
            if (currentTargetIds.length) {
                this.logger.log(`Deleting targets ${currentTargetIds} on rule`);
                // get the Ids from the currentTargets list where the ARN matches the ones in the remove list
                await this.removeTargets(subscription.Name, subscription.EventBusName, currentTargetIds);
            }

            this.logger.log(`Deleting rule ${subscription.Name} on eventbus ${subscription.EventBusName}`);
            this.eventBridge.deleteRule({
                Name: subscription.Name,
                EventBusName: subscription.EventBusName,
            });

            return subscription;
        } catch (error) {
            this.logger.error(`Error deleting rule & target: ${JSON.stringify(error)}.`);
            throw error;
        }
    }

    async updateSubscription(subscription: Subscription): Promise<Subscription> {
        this.logger.debug('[updateSubscription]');
        try {
            // attempt to update Rule
            subscription.EventBusName = this.getEventBusName(subscription.Broker);
            this.logger.log(`Updating rule ${subscription.Name} on eventbus ${subscription.EventBusName}`);
            const ruleArn = await this.saveRule(subscription);

            // Need to perform a delta of targets so that new can be added, non-existant can be removed and
            // get the existing targets
            const currentTargets = await this.listTargetsByRule(subscription.Name, subscription.EventBusName);
            const currentTargetArns = currentTargets ? currentTargets.map((ct) => ct.Arn!) : [];
            // filter to find out if there are any new targets in the array
            const newTargetArns = subscription.Targets?.filter((t) => !currentTargetArns?.includes(t));
            // also get a list of ones that need to be removed
            const removeTargetArns = currentTargetArns.filter((ct) => !subscription.Targets?.includes(ct));

            if (newTargetArns && newTargetArns.length) {
                this.logger.log(`Creating targets ${newTargetArns} on rule`);
                await this.addTargets(newTargetArns, subscription.Name, subscription.EventBusName, subscription.Broker);
            }

            if (removeTargetArns.length) {
                this.logger.log(`Deleting targets ${removeTargetArns} on rule`);
                // get the Ids from the currentTargets list where the ARN matches the ones in the remove list
                const targetIds = currentTargets
                    ?.filter((ct) => removeTargetArns.includes(ct.Arn!))
                    .map((r) => r.Id) as string[];
                await this.removeTargets(subscription.Name, subscription.EventBusName, targetIds);
            }

            // Add the RuleArn and targetArns (as some would get dropped if multiple were requested for prod)
            const updatedTargets = await this.listTargetsByRule(subscription.Name, subscription.EventBusName); // TODO, could improve this by doing a merge on the current/new/remove target ARNs, but this seems easier
            return {
                ...subscription,
                RuleArn: ruleArn,
                Targets: updatedTargets?.map((t) => t.Arn + ''),
            };
        } catch (error) {
            this.logger.error(`Error creating target for rule: ${JSON.stringify(error)}.`);
            throw error;
        }
    }

    /**
     * Creates/updates a rule based
     */
    async saveRule(subscription: Subscription): Promise<string> {
        this.logger.debug('[saveRule]');

        try {
            //TODO
            //Add RoleArn
            const ruleRequest: PutRuleCommandInput = {
                Name: subscription.Name,
                Description: subscription.Description,
                EventPattern: subscription.RulePattern,
                EventBusName: subscription.EventBusName,
                State: subscription.State,
                Tags: [
                    { Key: 'cmdb:AppCode', Value: subscription.AppCINumber },
                    { Key: 'cmdb:AppName', Value: subscription.AppName },
                    { Key: 'CostCode', Value: subscription.CostCode },
                ],
            };

            this.logger.log(`Saving rule with params: ${JSON.stringify(ruleRequest, null, 2)}`);
            const result = await this.eventBridge.putRule(ruleRequest);
            this.logger.log(`Created rule: ${JSON.stringify(result.RuleArn)}`);
            if (!result.RuleArn) {
                throw new InternalServerErrorException('Undefined RuleArn');
            }
            return result.RuleArn;
        } catch (error: unknown) {
            this.logger.error('Error saving rule: ' + error);
            if (error instanceof EventBridgeServiceException) {
                switch (error.name) {
                    case 'ValidationException':
                        throw new BadRequestException(error.message);
                    case 'InvalidEventPatternException':
                        throw new BadRequestException(error.message);
                    default:
                        throw new InternalServerErrorException(error.message);
                }
            }
            throw error;
        }
    }

    async addTargets(
        targets?: string[],
        ruleName?: string,
        eventbusName?: string,
        broker?: BrokerTypes,
    ): Promise<Target[]> {
        this.logger.debug('[putTargets]');

        const targetParams = this.constructTargets(targets, broker);

        const targetRequest: PutTargetsCommandInput = {
            Rule: ruleName,
            Targets: targetParams,
            EventBusName: eventbusName,
        };

        this.logger.log(`Creating target with params: ${JSON.stringify(targetRequest, null, 2)}`);
        const result = await this.eventBridge.putTargets(targetRequest);
        this.logger.log('Created target result:' + JSON.stringify(result));
        if (result.FailedEntryCount !== undefined && result.FailedEntryCount > 0) {
            const messages = result.FailedEntries?.map((e) => e.ErrorMessage);
            throw new InternalServerErrorException(messages?.join(', '));
        }
        return targetParams;
    }

    async removeTargets(ruleName?: string, eventBusName?: string, targetIds?: string[]) {
        this.logger.debug('[removeTargets]');

        try {
            const params: RemoveTargetsCommandInput = {
                Rule: ruleName,
                EventBusName: eventBusName,
                Ids: targetIds,
            };
            await this.eventBridge.removeTargets(params);
        } catch (error: unknown) {
            this.logger.error(`Error removing targers: ${error}`);
            if (error instanceof EventBridgeServiceException) {
                switch (error.name) {
                    case 'ValidationException':
                        throw new BadRequestException(error.message);
                    case 'ResourceNotFoundException':
                        throw new NotFoundException(error.message);
                    default:
                        throw new InternalServerErrorException(error.message);
                }
            }
            throw error;
        }
    }

    async listTargetsByRule(ruleName?: string, eventbusName?: string): Promise<Target[] | undefined> {
        this.logger.debug('[listTargetsByRule]');
        try {
            const params: ListTargetsByRuleCommandInput = {
                EventBusName: eventbusName,
                Rule: ruleName,
            };
            this.logger.log(`Getting targets in the EventBus for a given rule: ${JSON.stringify(params)}`);
            const result = await this.eventBridge.listTargetsByRule(params);
            return result.Targets;
        } catch (error) {
            this.logger.error(`Error fetching rule targets: ${error}`);
            throw new InternalServerErrorException(error);
        }
    }

    private constructTargets(targets?: string[], broker?: BrokerTypes): Target[] {
        this.logger.debug('[constructTargets]');
        if (!targets || !broker) {
            throw new Error('No targets or broker specified');
        }
        const retTarget: Target[] = [];
        if (targets.length > 1 && broker === BrokerTypes.NP) {
            targets.map((t: string) =>
                retTarget.push({
                    Id: randomUUID(),
                    Arn: t,
                    DeadLetterConfig: {
                        Arn: this.getDlqArn(BrokerTypes.NP),
                    },
                    RoleArn: t.includes('api-destination')
                        ? this.getInvokeApiDestRoleArn(BrokerTypes.NP)
                        : this.getPutEventBusDestRoleArn(BrokerTypes.NP),
                }),
            );
        } else {
            retTarget.push({
                Id: randomUUID(),
                Arn: targets[0],
                DeadLetterConfig: {
                    Arn: this.getDlqArn(broker),
                },
                RoleArn: targets[0].includes('api-destination')
                    ? this.getInvokeApiDestRoleArn(broker)
                    : this.getPutEventBusDestRoleArn(broker),
            });
        }
        return retTarget;
    }

    private getEventBusName(broker?: BrokerTypes): string {
        return broker?.toUpperCase() === BrokerTypes.PRD ? this.eventBusName : this.eventBusNameNp;
    }

    private getDlqArn(broker?: BrokerTypes) {
        return broker?.toUpperCase() === BrokerTypes.PRD ? this.dlqArn : this.dlqArnNp;
    }

    private getInvokeApiDestRoleArn(broker?: BrokerTypes) {
        return broker?.toUpperCase() === BrokerTypes.PRD ? this.invokeApiDestRoleArn : this.invokeApiDestRoleArnNp;
    }

    private getPutEventBusDestRoleArn(broker?: BrokerTypes) {
        return broker?.toUpperCase() === BrokerTypes.PRD ? this.putEventBusDestRoleArn : this.putEventBusDestRoleArnNp;
    }
}
