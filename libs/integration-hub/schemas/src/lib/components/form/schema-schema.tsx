import { z } from 'zod';

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

const exampleSchema = z.object({
    Metadata: z.object({
        Guid: z.string(),
        Time: z.string(),
        Version: z.string(),
    }),
    Data: z.unknown(),
});

export const schemaFormSchema = z.object({
    Content: z
        .string()
        .nonempty({ message: 'Field is mandatory' })
        .refine((data) => {
            try {
                return JSON.parse(data);
            } catch (err: unknown) {
                return false;
            }
        }),
    Description: z.string().nonempty({ message: 'Field is mandatory' }),
    EventClassification: z.enum(['internal', 'confidential', 'most confidential']),
    EventName: z.string().regex(/^(?:[A-Z][a-z0-9]*)+$/, {
        message: "Must use 'PascalCase' and only contain alphanumeric characters",
    }),
    Example: z
        .string()
        .nonempty({ message: 'Field is mandatory' })
        .refine((data) => {
            try {
                return exampleSchema.parse(JSON.parse(data));
            } catch (err: unknown) {
                return false;
            }
        }),
    SchemaSupportGroup: z.string().nonempty({ message: 'Field is mandatory' }),
    Application: appSchema,
    Domain: domainSchema,
});

export type SchemaForm = z.infer<typeof schemaFormSchema>;
