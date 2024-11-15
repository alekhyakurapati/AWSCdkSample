import { useAuthenticatedFetch } from '@eai-event-integration-platform/auth-ui';
import { SchemaDetails } from '@eai-event-integration-platform/interfaces';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { closeSnackbar, enqueueSnackbar } from 'notistack';

export const useCreateSchema = () => {
    const authenticatedFetch = useAuthenticatedFetch();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (schema: SchemaDetails) => {
            enqueueSnackbar({ key: 'new-schema', message: 'Registering new schema...' });
            await authenticatedFetch('/schemas', {
                method: 'POST',
                body: JSON.stringify(schema),
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
            });
        },
        onSuccess: () => {
            closeSnackbar('new-schema');
            queryClient.invalidateQueries({ queryKey: ['schemas'] });
            enqueueSnackbar({ message: 'Registered new schema', variant: 'success' });
        },

        onError: (error) => {
            closeSnackbar('new-schema');
            if (error instanceof Error && error.message) {
                enqueueSnackbar({ message: error.message, variant: 'error' });
            } else {
                enqueueSnackbar({ message: 'Encountered error registering schema', variant: 'error' });
            }
        },
    });
};
