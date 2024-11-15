import { useAuthenticatedFetch } from '@eai-event-integration-platform/auth-ui';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Connection } from '@eai-event-integration-platform/interfaces';
import { closeSnackbar, enqueueSnackbar } from 'notistack';

export const useUpdateConnection = () => {
    const authenticatedFetch = useAuthenticatedFetch();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (connection: Connection) => {
            const connectionName = connection.ConnectionName;
            enqueueSnackbar({ key: connectionName, message: `Updating ${connectionName}` });

            await authenticatedFetch(`/connections/${connectionName}`, {
                method: 'PUT',
                body: JSON.stringify(connection),
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
            });
        },
        onSuccess: (_data, connection) => {
            closeSnackbar(connection.ConnectionName);
            queryClient.invalidateQueries({ queryKey: ['connections'] });
            enqueueSnackbar({ message: `Updated ${connection.ConnectionName}`, variant: 'success' });
        },

        onError: (error, connection) => {
            closeSnackbar(connection.ConnectionName);
            if (error instanceof Error && error.message) {
                enqueueSnackbar({ message: error.message, variant: 'error' });
            } else {
                enqueueSnackbar({
                    message: `Encountered error updating ${connection.ConnectionName}`,
                    variant: 'error',
                });
            }
        },
    });
};
