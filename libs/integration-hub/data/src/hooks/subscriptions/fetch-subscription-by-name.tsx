import { useAuthenticatedFetch } from '@eai-event-integration-platform/auth-ui';
import { Subscription } from '@eai-event-integration-platform/interfaces';
import { useQuery } from '@tanstack/react-query';

export const useFetchSubscription = (subscriptionName: string | undefined) => {
    const authenticatedFetch = useAuthenticatedFetch();

    return useQuery<Subscription>(
        ['subscriptions', subscriptionName],
        () => {
            return authenticatedFetch(`/subscriptions/${subscriptionName}`);
        },
        { enabled: !!subscriptionName },
    );
};
