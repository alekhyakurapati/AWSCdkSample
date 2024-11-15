import { useAuthenticatedFetch } from '@eai-event-integration-platform/auth-ui';
import { Application } from '@eai-event-integration-platform/interfaces';
import { useQuery } from '@tanstack/react-query';

interface Props {
    userOwned?: boolean;
    enabled?: boolean;
}

export const useFetchAllApplications = (props?: Props) => {
    const authenticatedFetch = useAuthenticatedFetch();
    const userOwned = props?.userOwned ?? true;
    const enabled = props?.enabled ?? true;

    return useQuery<Application[]>(
        ['applications', userOwned],
        () => {
            const params = new URLSearchParams();

            if (userOwned) params.set('user-owned', 'true');

            return authenticatedFetch(`/applications?${params.toString()}`);
        },
        { enabled },
    );
};
