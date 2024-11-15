import { useAuthenticatedFetch } from '@eai-event-integration-platform/auth-ui';
import { ConnectionAuthStatus } from '@eai-event-integration-platform/interfaces';
import { useQuery } from '@tanstack/react-query';

export const useFetchConnectionAuthStatus = (props: { conName: string }) => {
    const authenticatedFetch = useAuthenticatedFetch();

    return useQuery<ConnectionAuthStatus>(['authStatus', props.conName], async () => {
        const result = await authenticatedFetch(`/connections/${props.conName}/auth-status`);
        return result.AuthStatus;
    });
};
