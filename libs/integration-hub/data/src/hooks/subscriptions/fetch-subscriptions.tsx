import { useAuthenticatedFetch } from '@eai-event-integration-platform/auth-ui';
import { Subscription } from '@eai-event-integration-platform/interfaces';
import { useQuery } from '@tanstack/react-query';

interface Props {
    schemaName?: string;
    userOwned?: boolean;
}

export const useFetchSubscriptions = (props?: Props) => {
    const authenticatedFetch = useAuthenticatedFetch();
    const urlParams = new URLSearchParams();
    const userOwned = props?.userOwned ?? true;
    const schemaName = props?.schemaName;

    const queryKey = ['subscriptions'];
    if (userOwned) {
        urlParams.set('user-owned', 'true');
    }

    if (schemaName) {
        urlParams.set('schema-name', schemaName);
        queryKey.push(schemaName);
    }
    const urlString = urlParams.toString();

    return useQuery<Subscription[]>(queryKey, () => authenticatedFetch(`/subscriptions?${urlString}`));
};
