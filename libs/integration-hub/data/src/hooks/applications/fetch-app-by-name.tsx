import { useAuthenticatedFetch } from '@eai-event-integration-platform/auth-ui';
import { Application } from '@eai-event-integration-platform/interfaces';
import { useQuery } from '@tanstack/react-query';

export const useFetchApplicationByName = (appName: string | undefined) => {
    const applicationName = appName ?? '';
    const authenticatedFetch = useAuthenticatedFetch();
    return useQuery<Application>(
        ['applications', applicationName],
        () => authenticatedFetch(`/applications/${applicationName}`),
        { enabled: !!appName },
    );
};
