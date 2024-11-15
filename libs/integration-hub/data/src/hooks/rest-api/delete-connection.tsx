import { useAuthenticatedFetch } from '@eai-event-integration-platform/auth-ui';
import { Connection } from '@eai-event-integration-platform/interfaces';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { closeSnackbar, enqueueSnackbar } from 'notistack';

export const useDeleteConnection = () => {
    const authenticatedFetch = useAuthenticatedFetch();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (connection: Connection) => {
            enqueueSnackbar({
                key: 'delete-connection',
                message: `Deleting connection ${connection.ConnectionName} ...`,
            });
            await authenticatedFetch(`/connections/${connection.ConnectionName}`, {
                method: 'DELETE',
            });
        },
        onSuccess: (_, connection) => {
            closeSnackbar('delete-connection');
            queryClient.invalidateQueries({ queryKey: ['connections'] });
            enqueueSnackbar({
                message: `Successfully deleted connection ${connection.ConnectionName}`,
                variant: 'success',
            });
        },

        onError: (error) => {
            closeSnackbar('delete-connection');
            if (error instanceof Error && error.message) {
                enqueueSnackbar({ message: error.message, variant: 'error' });
            } else {
                enqueueSnackbar({ message: 'Encountered error deleting connection', variant: 'error' });
            }
        },
    });
};
