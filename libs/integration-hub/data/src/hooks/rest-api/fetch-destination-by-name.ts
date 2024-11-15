import { useAuthenticatedFetch } from '@eai-event-integration-platform/auth-ui';
import { useQuery } from '@tanstack/react-query';
import { Destination } from '@eai-event-integration-platform/interfaces';

export const useFetchDestinationByName = (connectionName: string | undefined, destinationName: string | undefined) => {
    const authenticatedFetch = useAuthenticatedFetch();

    return useQuery<Destination>(
        ['destinations', connectionName, destinationName],
        () => authenticatedFetch(`/connections/${connectionName}/destinations/${destinationName}`),
        { enabled: !!connectionName && !!destinationName },
    );
};
