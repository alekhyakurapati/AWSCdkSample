import { BrokerTypes } from '@eai-event-integration-platform/interfaces';
import { useAuthenticatedFetch } from '@eai-event-integration-platform/auth-ui';
import { useQuery } from '@tanstack/react-query';

export interface EventFailureFilterResponse {
    SubscriptionIds: string[];
    TargetArns: string[];
}

export const useFetchDeliveryFailuresFilterOptions = (props: {
    broker: BrokerTypes;
    subscriberApplication: string | undefined;
}) => {
    const authenticatedFetch = useAuthenticatedFetch();

    return useQuery<EventFailureFilterResponse, Error>({
        queryKey: ['message-filter-options', props.broker, props.subscriberApplication],
        queryFn: () => {
            const urlParams = new URLSearchParams();
            urlParams.set('broker', props.broker);
            if (props.subscriberApplication) {
                urlParams.set('subscriberApplication', props.subscriberApplication);
            }

            return authenticatedFetch(`/event-failures/filter-values?` + urlParams.toString());
        },
        enabled: !!props.subscriberApplication,
    });
};
