import { BrokerTypes, SchemaDetails, Subscription } from '@eai-event-integration-platform/interfaces';
import { SubscriptionForm } from './subscription-schema';

export const newRule = (schemaDetails: SchemaDetails) => {
    const split = schemaDetails.SchemaName?.split('@');
    const source = split?.[0] ?? '';
    const detailType = split?.[1] ?? '';

    return JSON.stringify(
        {
            source: [source],
            'detail-type': [detailType],
            detail: {
                Metadata: {
                    Version: [schemaDetails.Version ?? '1'],
                },
            },
        },
        null,
        4,
    );
};

interface CreateSubFormProps {
    schema: SchemaDetails | undefined;
    prodType: BrokerTypes | undefined;
}

export const initCreateSubscriptionForm = ({ schema, prodType }: CreateSubFormProps): SubscriptionForm => {
    return {
        Application: {
            CINumber: '',
            CostCode: '',
            Owner: '',
            ShortName: '',
        },
        Broker: prodType ?? BrokerTypes.NP,
        Description: '',
        RulePattern: schema ? newRule(schema) : '',
        Domain: {
            Domain: '',
            SubDomain: '',
            SubSubDomain: '',
            CustomSubSubDomain: '',
        },
        TargetType: 'EventBus',
        Targets: [{ value: '' }],
    };
};

export const initEditSubscriptionForm = (existingSubscription: Subscription | undefined): SubscriptionForm => {
    const subbingDomain = existingSubscription?.SubscribingDomain?.split('.');

    const existingTarget = existingSubscription?.Targets?.[0];
    const targetType = existingTarget?.includes('api-destination') ? 'RestAPI' : 'EventBus';

    // React hook form field array has buggy behaviour w/ strings, mapping to object below fixes issues
    const targets = existingSubscription?.Targets?.map((target) => ({ value: target })) ?? [{ value: '' }];

    return {
        Application: {
            CINumber: existingSubscription?.AppCINumber ?? '',
            CostCode: existingSubscription?.CostCode ?? '',
            Owner: existingSubscription?.SubscriptionOwner ?? '',
            ShortName: existingSubscription?.AppName ?? '',
        },
        Broker: existingSubscription?.Broker ?? BrokerTypes.NP,
        Description: existingSubscription?.Description ?? '',
        RulePattern: existingSubscription?.RulePattern ?? '',
        Domain: {
            // NOTE: domain[0] = 'wel'
            Domain: subbingDomain?.[1] ?? '',
            SubDomain: subbingDomain?.[2] ?? '',
            SubSubDomain: subbingDomain?.[3] ?? '',
            CustomSubSubDomain: '',
        },
        TargetType: targetType,
        Targets: targets,
    };
};
