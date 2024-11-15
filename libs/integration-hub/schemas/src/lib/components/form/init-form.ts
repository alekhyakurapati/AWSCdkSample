import { SchemaDetails } from '@eai-event-integration-platform/interfaces';
import { z } from 'zod';
import { SchemaForm } from './schema-schema';
import { parseSchema } from './parse-schema';

const DEFAULT_SCHEMA = JSON.stringify(
    {
        Metadata: {
            Guid: 'Guid data',
            Time: 'Time data',
            Version: '1',
        },
        Data: '[Your object here]',
    },
    undefined,
    4,
);

export const initSchemaForm = (schema: SchemaDetails | undefined): SchemaForm => {
    if (!schema) {
        return {
            Content: parseSchema(DEFAULT_SCHEMA),
            Description: '',
            // @ts-ignore: initial value is not an enum variant
            EventClassification: '',
            EventName: '',
            Example: DEFAULT_SCHEMA,
            SchemaSupportGroup: '',
            Application: {
                CINumber: '500',
                CostCode: '',
                Owner: '',
                ShortName: '',
            },
            Domain: {
                Domain: '',
                SubDomain: '',
                SubSubDomain: '',
                CustomSubSubDomain: '',
            },
        };
    }

    const domain = schema.Domain?.split('.');
    const eventName = schema.SchemaName?.split('@').at(-1) ?? '';
    const parseExample = z
        .preprocess((data) => JSON.parse(data as string), z.object({ examples: z.unknown().array() }))
        .transform((data) => JSON.stringify(data.examples.at(0) ?? {}, undefined, 4))
        .safeParse(schema.Content);
    const example = parseExample.success ? parseExample.data : DEFAULT_SCHEMA;

    return {
        Content: schema.Content ?? parseSchema(DEFAULT_SCHEMA),
        Description: schema.Description ?? '',
        EventClassification: schema.EventClassification ?? 'most confidential',
        EventName: eventName,
        Example: example,
        SchemaSupportGroup: schema.SchemaSupportGroup ?? '',
        Application: {
            CINumber: schema.AppCINumber ?? '',
            CostCode: schema.CostCode ?? '',
            Owner: schema.SchemaOwner ?? '',
            ShortName: schema.AppName ?? '',
        },
        Domain: {
            // NOTE: domain[0] = 'wel'
            Domain: domain?.[1] ?? '',
            SubDomain: domain?.[2] ?? '',
            SubSubDomain: domain?.[3] ?? '',
            CustomSubSubDomain: '',
        },
    };
};
