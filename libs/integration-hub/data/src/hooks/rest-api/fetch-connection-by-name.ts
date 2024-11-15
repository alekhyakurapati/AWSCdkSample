import { useAuthenticatedFetch } from '@eai-event-integration-platform/auth-ui';
import { useQuery } from '@tanstack/react-query';
import { Connection } from '@eai-event-integration-platform/interfaces';

export const useFetchConnectionByName = (connectionName: string | undefined) => {
    const authenticatedFetch = useAuthenticatedFetch();

    return useQuery<Connection>(
        ['connections', connectionName],
        () => authenticatedFetch(`/connections/${connectionName}`),
        { enabled: !!connectionName },
    );
};
