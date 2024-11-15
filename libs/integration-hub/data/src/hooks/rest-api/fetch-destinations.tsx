import { useAuthenticatedFetch } from '@eai-event-integration-platform/auth-ui';
import { Destination } from '@eai-event-integration-platform/interfaces';
import { useQuery } from '@tanstack/react-query';

interface Props {
    userOwned?: boolean;
}

export const useFetchDestinations = (props?: Props) => {
    const authenticatedFetch = useAuthenticatedFetch();
    const userOwned = props ? props.userOwned : false;
    const urlParams = new URLSearchParams();

    if (userOwned) {
        urlParams.set('user-owned', 'true');
    }
    urlParams.set('type', 'Destination');

    return useQuery<Destination[]>(['destinations', userOwned], async () =>
        authenticatedFetch(`/connections?${urlParams.toString()}`),
    );
};
