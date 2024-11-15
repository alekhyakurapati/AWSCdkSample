import { BrokerTypes, Subscription, SubscriptionState } from '@eai-event-integration-platform/interfaces';
import { IsNotEmpty, Matches, IsString, IsEnum, IsArray, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class CreateSubscriptionDto implements Subscription {
    @IsArray()
    @ArrayMinSize(1, { message: 'Array length must be more than 1 element' })
    @ArrayMaxSize(5, { message: 'Array length must be less than 5 elements' })
    @IsNotEmpty({ each: true, message: 'Array elements cannot be empty' })
    @IsString({ each: true, message: 'Array elements must be of type string' })
    @Matches(/^arn:aws[\w-]*:events:[a-z]{2}-[a-z]+-[\w-]+:[0-9]{12}:event-bus|api-destination\/[.\-_A-Za-z0-9]+/, {
        each: true,
        message:
            'Target EventBus | Api-Destination ARN must follow the following regexp arn:aws[w-]*:events:[a-z]{2}-[a-z]+-[w-]+:[0-9]{12}:event-bus|api-destination/[.-_A-Za-z0-9]+ ',
    })
    Targets: string[];

    @IsNotEmpty()
    @IsString()
    Description: string;

    @IsNotEmpty()
    @IsString()
    RulePattern: string;

    @IsNotEmpty()
    @IsString()
    SchemaName: string;

    @IsNotEmpty()
    @IsString()
    SchemaVersion: string;

    @IsNotEmpty()
    @IsString()
    CostCode: string;

    @IsNotEmpty()
    @IsString()
    AppName: string;

    @IsNotEmpty()
    @IsString()
    AppCINumber: string;

    @IsNotEmpty()
    @IsString()
    OwnerRole: string;

    @IsNotEmpty()
    @IsString()
    SubscriptionOwner: string;

    @IsNotEmpty()
    @IsString()
    SubscribingDomain: string;

    @IsNotEmpty()
    @IsEnum(BrokerTypes, { message: 'Broker must be either PRD or NP' })
    Broker: BrokerTypes;

    @IsEnum(SubscriptionState, { message: 'State should be either ENABLED or DISABLED' })
    State?: SubscriptionState = SubscriptionState.ENABLED;

    // @IsNotEmpty()
    // Tags: {
    //     [key: string]: string;
    // };
}
