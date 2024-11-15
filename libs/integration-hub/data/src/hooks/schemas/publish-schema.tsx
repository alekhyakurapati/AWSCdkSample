import { useAuthenticatedFetch } from '@eai-event-integration-platform/auth-ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { closeSnackbar, enqueueSnackbar } from 'notistack';
import { ActiveSchema } from '../../types';

export const usePublishSchema = (activeSchema: ActiveSchema | undefined) => {
    const { SchemaName } = activeSchema ?? {};
    const authenticatedFetch = useAuthenticatedFetch();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            enqueueSnackbar({ key: SchemaName, message: 'Publishing...' });
            await authenticatedFetch(`/schemas/${SchemaName}/versions/publish`, { method: 'POST' });
        },
        onSuccess: () => {
            closeSnackbar(SchemaName);
            queryClient.invalidateQueries({ queryKey: ['schemas'] });
            enqueueSnackbar({ message: 'Schema published successfully', variant: 'success' });
        },

        onError: (error) => {
            closeSnackbar(SchemaName);
            if (error instanceof Error) {
                enqueueSnackbar({ message: error.message, variant: 'error' });
            } else {
                enqueueSnackbar({ message: 'Encountered error publishing schema', variant: 'error' });
            }
        },
    });
};
