import { useAuthenticatedFetch } from '@eai-event-integration-platform/auth-ui';
import { SchemaSummary } from '@eai-event-integration-platform/interfaces';
import { useQuery } from '@tanstack/react-query';

export const useFetchAllSchemas = () => {
    const authenticatedFetch = useAuthenticatedFetch();

    return useQuery<SchemaSummary[]>(['schemas'], async () => await authenticatedFetch(`/schemas`));
};
