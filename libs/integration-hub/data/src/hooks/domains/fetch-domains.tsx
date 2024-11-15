import { useAuthenticatedFetch } from '@eai-event-integration-platform/auth-ui';
import { Domain } from '@eai-event-integration-platform/interfaces';
import { useQuery } from '@tanstack/react-query';

interface Props {
    enabled?: boolean;
}

export const useFetchDomainsTree = (props?: Props) => {
    const authenticatedFetch = useAuthenticatedFetch();
    const enabled = props?.enabled ?? true;

    return useQuery<Domain[]>(['domainNamesTree'], () => authenticatedFetch(`/domains/tree`), { enabled });
};
