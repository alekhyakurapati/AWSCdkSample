import { Destination } from '@eai-event-integration-platform/interfaces';
import { z } from 'zod';

export const TargetAPIsFormSchema = z.object({
    SubscriberApplication: z.string().nonempty({ message: 'Field is mandatory' }),
    APIEnvironment: z.string().nonempty({ message: 'Field is mandatory' }),
    HttpMethod: z.string().nonempty({ message: 'Field is mandatory' }),
    ApiEndpoint: z
        .string()
        .nonempty({ message: 'Must provide an API endpoint' })
        .regex(new RegExp("^((%[0-9A-Fa-f]{2}|[-()_.!~*';/?:@\x26=+$,A-Za-z0-9])+)([).!';/?:,])?$"), {
            message: 'Field is in an invalid format',
        }),
    Name: z
        .string()
        .nonempty({ message: 'Must provide an API Name' })
        .regex(new RegExp('^[A-Za-z-]*$'), { message: 'Only letters and hyphen allowed' }),
    Description: z
        .string()
        .nonempty({ message: 'Must provide a description' })
        .max(512, { message: 'Field has more than 512 characters' }),
    InvocationRate: z
        .number()
        .min(1, { message: 'Number must be between 1 and 300 ' })
        .max(300, { message: 'Number must be between 1 and 300' }),
    AuthSelection: z.string().nonempty({ message: 'Must provide an Authorisation' }),
});

export const initTargetAPIsFormValues = (
    destination: Destination | undefined,
    appName: string,
    prodType: string,
): ITargetAPIsForm => {
    return {
        SubscriberApplication: destination?.AppName || appName || '',
        APIEnvironment: destination?.Broker || prodType || '',
        HttpMethod: destination?.HttpMethod ?? '',
        ApiEndpoint: destination?.InvocationEndpoint ?? '',
        Name: destination?.DestinationName?.split('.')[1] || '',
        Description: destination?.Description ?? '',
        InvocationRate: destination?.InvocationRateLimitPerSecond ?? 1,
        AuthSelection: destination?.ConnectionName ?? '',
    };
};
export type ITargetAPIsForm = z.infer<typeof TargetAPIsFormSchema>;
