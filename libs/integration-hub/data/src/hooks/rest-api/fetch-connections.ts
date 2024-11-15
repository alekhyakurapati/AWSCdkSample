import { useAuthenticatedFetch } from '@eai-event-integration-platform/auth-ui';
import { Connection } from '@eai-event-integration-platform/interfaces';
import { useQuery } from '@tanstack/react-query';

interface Props {
    userOwned?: boolean;
    enabled?: boolean;
}

export const useFetchConnections = (props?: Props) => {
    const authenticatedFetch = useAuthenticatedFetch();
    const userOwned = props?.userOwned ?? true;
    const enabled = props?.enabled ?? true;

    return useQuery<Connection[]>(
        ['connections', userOwned],
        () => {
            const params = new URLSearchParams();

            if (userOwned) params.set('user-owned', 'true');

            return authenticatedFetch(`/connections?${params.toString()}`);
        },
        { enabled },
    );
};
