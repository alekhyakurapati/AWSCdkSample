import { useAuthenticatedFetch } from '@eai-event-integration-platform/auth-ui';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { closeSnackbar, enqueueSnackbar } from 'notistack';
import { Connection } from '@eai-event-integration-platform/interfaces';

export const useCreateConnection = () => {
    const authenticatedFetch = useAuthenticatedFetch();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (connection: Connection) => {
            enqueueSnackbar({ key: 'new-connection', message: 'Registering new connection...' });
            await authenticatedFetch('/connections', {
                method: 'POST',
                body: JSON.stringify(connection),
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
            });
        },
        onSuccess: () => {
            closeSnackbar('new-connection');
            queryClient.invalidateQueries({ queryKey: ['connections'] });
            enqueueSnackbar({ message: 'Registered new connection', variant: 'success' });
        },

        onError: (error) => {
            closeSnackbar('new-connection');
            if (error instanceof Error && error.message) {
                enqueueSnackbar({ message: error.message, variant: 'error' });
            } else {
                enqueueSnackbar({ message: 'Encountered error registering connection', variant: 'error' });
            }
        },
    });
};
