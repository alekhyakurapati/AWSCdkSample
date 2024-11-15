import { useAuthenticatedFetch } from '@eai-event-integration-platform/auth-ui';
import { useQuery } from '@tanstack/react-query';
import { ActiveSchema } from '../../types';

export const useFetchRecentEvents = (activeSchema: ActiveSchema | undefined) => {
    const { SchemaName } = activeSchema ?? {};
    const authenticatedFetch = useAuthenticatedFetch();
    const urlParams = new URLSearchParams();
    urlParams.set('hours', '168'); // 168hrs in a week, maximum log time for CloudWatch

    return useQuery<Record<string, unknown>[]>(
        ['schemas', SchemaName, 'recent-events'],
        () => authenticatedFetch(`/schemas/${SchemaName}/recent-events?${urlParams.toString()}`),
        { enabled: !!activeSchema },
    );
};
