import { SchemaDetails } from '@eai-event-integration-platform/interfaces';
import { z, ZodError } from 'zod';
import { eventRuleSchema, subscriptionFormSchema } from '../components/form/subscription-schema';

const code = z.ZodIssueCode.custom;
const path = ['RulePattern'];

export const useSubscriptionFormResolver = (schema: SchemaDetails | undefined, isProd: boolean) => {
    return subscriptionFormSchema.superRefine(({ RulePattern }, ctx) => {
        try {
            const eventName = schema?.SchemaName?.split('@').at(-1);
            const rule = eventRuleSchema.parse(JSON.parse(RulePattern));
            const availableVersions = Object.entries(schema?.AvailableVersions ?? {})
                .filter((v) => !(v.at(1) === 'depr'))
                .filter((v) => !(isProd && v.at(1) === 'drft'))
                .map((v) => v.at(0));

            if (!rule.source.includes(schema?.Domain ?? ''))
                ctx.addIssue({
                    code,
                    path,
                    message: `Source does not match the selected schema: ${schema?.Domain}`,
                });

            if (!rule['detail-type'].includes(eventName ?? ''))
                ctx.addIssue({
                    code,
                    path,
                    message: `Detail-type does not match the selected schema: ${eventName}`,
                });

            if (!rule.detail.Metadata.Version.every((version) => availableVersions.includes(version)))
                ctx.addIssue({
                    code,
                    path,
                    message: `Version number does not match an available version: [ ${availableVersions.join(', ')} ]`,
                });
        } catch (err: unknown) {
            if (err instanceof ZodError)
                // Rule schema error
                ctx.addIssue({
                    code,
                    path,
                    message:
                        'JSON does not match rule schema, do you have "source", "detail-type", and "detail.Metadata.Version"?',
                });
            // JSON parse error
            else
                ctx.addIssue({
                    code,
                    path,
                    message: 'Invalid JSON object',
                });
        }
    });
};
