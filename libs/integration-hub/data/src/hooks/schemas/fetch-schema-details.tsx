import { useAuthenticatedFetch } from '@eai-event-integration-platform/auth-ui';
import { SchemaDetails } from '@eai-event-integration-platform/interfaces';
import { useQuery } from '@tanstack/react-query';
import { ActiveSchema } from '../../types';

export const useFetchSchemaDetails = (activeSchema: ActiveSchema | undefined) => {
    const { SchemaName, Version } = activeSchema ?? {};
    const authenticatedFetch = useAuthenticatedFetch();

    return useQuery<SchemaDetails>(
        ['schemas', SchemaName, Version?.toString()],
        () => authenticatedFetch(`/schemas/${SchemaName}/versions/${Version}`),
        { enabled: !!activeSchema },
    );
};
