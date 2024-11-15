import { ResourceNotFoundException } from '@aws-sdk/client-eventbridge';
import { Inject, Injectable } from '@nestjs/common';
import {
    ValidatorConstraint,
    ValidatorConstraintInterface,
    ValidationArguments,
    ValidationOptions,
    registerDecorator,
} from 'class-validator';
import { CreateSubscriptionDto } from '../dto';
import { SubscriptionsService } from '../subscriptions.service';

@ValidatorConstraint({ name: 'uniqueRuleName', async: true })
@Injectable()
export class UniqueRuleNameConstraint implements ValidatorConstraintInterface {
    constructor(private readonly subService: SubscriptionsService) {}

    async validate(value: string, args: ValidationArguments) {
        // getRule() throws an error if no rule is found by specified name, so if no error
        // is thrown, then a rule already exists and this function should return false (ie invalid)
        try {
            await this.subService.getRule(value, (args.object as CreateSubscriptionDto).Broker);
            return false;
        } catch (error) {
            if (error instanceof ResourceNotFoundException) {
                // no rule found, return valid response
                return true;
            }
            // otherwise throw other errors
            throw error;
        }
    }

    defaultMessage(args: ValidationArguments) {
        return `Name ${args.value} already exists`;
    }
}

export function UniqueRuleName(validationOptions?: ValidationOptions) {
    return function (object: any, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: UniqueRuleNameConstraint,
        });
    };
}
