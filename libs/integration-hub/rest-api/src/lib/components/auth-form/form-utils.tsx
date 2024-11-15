import { Connection } from '@eai-event-integration-platform/interfaces';
import { z } from 'zod';

export const authorisationFormSchema = z.object({
    SubscriberApplication: z.string().nonempty({ message: 'Field is mandatory' }),
    AuthorizationEnvironment: z.string().nonempty({ message: 'Field is mandatory' }),
    HttpMethod: z.string().nonempty({ message: 'Field is mandatory' }),
    AuthorizationEndpoint: z
        .string()
        .nonempty({ message: 'Must provide an Authorisation Endpoint' })
        .max(512, { message: 'Field has more than 512 characters' })
        .regex(new RegExp("^((%[0-9A-Fa-f]{2}|[-()_.!~*';/?:@\x26=+$,A-Za-z0-9])+)([).!';/?:,])?$"), {
            message: 'Field is in an invalid format',
        }),
    Name: z
        .string()
        .nonempty({ message: 'Must provide a name' })
        .regex(new RegExp('^[A-Za-z-]*$'), { message: 'Only letters and hyphen allowed' })
        .max(32, { message: 'Field has more than 32 characters' }),
    Description: z
        .string()
        .nonempty({ message: 'Must provide a description' })
        .max(512, { message: 'Field has more than 512 characters' }),
    ClientId: z
        .string()
        .nonempty({ message: 'Must provide a client id' })
        .max(512, { message: 'Field has more than 512 characters' }),
    ClientSecret: z
        .string()
        .nonempty({ message: 'Must provide a client secret' })
        .max(512, { message: 'Field has more than 512 characters' }),
    Scope: z
        .string()
        .nonempty({ message: 'Must provide a scope' })
        .max(512, { message: 'Field has more than 512 characters' }),
});

export const initAuthorisationFormValues = (
    connection: Connection | undefined,
    appName: string,
    prodType: string,
    clientSecret: string,
): IAuthorisationForm => {
    return {
        SubscriberApplication: connection?.AppName || appName || '',
        AuthorizationEnvironment: connection?.Broker || prodType || '',
        HttpMethod: connection?.HttpMethod || '',
        AuthorizationEndpoint: connection?.AuthorizationEndpoint ? connection?.AuthorizationEndpoint : '',
        Name: connection?.ConnectionName?.split('.')[1] || '',
        Description: connection?.Description || '',
        ClientId: connection?.ClientID || '',
        ClientSecret: clientSecret,
        Scope: connection?.Scope ? connection?.Scope : '',
    };
};
export type IAuthorisationForm = z.infer<typeof authorisationFormSchema>;
