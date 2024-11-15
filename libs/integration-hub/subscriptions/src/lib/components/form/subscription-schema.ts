import { BrokerTypes } from '@eai-event-integration-platform/interfaces';
import { z } from 'zod';
import * as lodash from 'lodash';

export const appSchema = z.object({
    CINumber: z.string().nonempty({ message: 'Field is mandatory' }),
    CostCode: z.string().nonempty({ message: 'Field is mandatory' }),
    Owner: z.string().nonempty({ message: 'Field is mandatory' }),
    ShortName: z.string().nonempty({ message: 'Field is mandatory' }),
});

export const domainSchema = z.object({
    Domain: z.string().nonempty({ message: 'Must provide a domain' }),
    SubDomain: z.string().nonempty({ message: 'Must provide a sub domain' }),
    SubSubDomain: z.string(),
    CustomSubSubDomain: z.string(),
});

export const eventRuleSchema = z.object({
    source: z.array(z.string().startsWith('wel.')).length(1),
    'detail-type': z.array(z.string()).length(1),
    detail: z.object({
        Metadata: z.object({
            Version: z.array(z.string()).length(1),
        }),
    }),
});

export type EventRule = z.infer<typeof eventRuleSchema>;

export const subscriptionFormSchema = z.object({
    Application: appSchema,
    Broker: z.nativeEnum(BrokerTypes),
    Description: z.string().nonempty({ message: 'Field is mandatory' }),
    // NOTE: The RulePattern is further refined when passed to the form, see `useSubscriptionFormResolver()`
    RulePattern: z.string().nonempty({ message: 'Field is mandatory' }),
    Domain: domainSchema,
    Targets: z
        .array(
            z.object({
                value: z.union([
                    z // REST API
                        .string()
                        .regex(
                            /^arn:aws[\w-]*:events:[a-z]{2}-[a-z]+-[\w-]+:[0-9]{12}:api-destination\/[.\-_A-Za-z0-9]+/,
                        ),

                    z // EventBus
                        .string()
                        .regex(/^arn:aws[\w-]*:events:[a-z]{2}-[a-z]+-[\w-]+:[0-9]{12}:event-bus\/[.\-_A-Za-z0-9]+/),
                ]),
            }),
        )
        .max(5)
        .refine(
            (vals) => {
                const values = vals.map((val) => val.value);
                return values.length === lodash.uniq(values).length;
            },
            { message: 'Duplicates in targets' },
        ),
    TargetType: z.enum(['EventBus', 'RestAPI']),
});

export type SubscriptionForm = z.infer<typeof subscriptionFormSchema>;
