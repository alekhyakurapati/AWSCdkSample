import { useAuthenticatedFetch } from '@eai-event-integration-platform/auth-ui';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { closeSnackbar, enqueueSnackbar } from 'notistack';
import { Destination } from '@eai-event-integration-platform/interfaces';

export const useCreateDestination = () => {
    const authenticatedFetch = useAuthenticatedFetch();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (destination: Destination) => {
            const connectionName = destination.ConnectionName;

            enqueueSnackbar({ key: 'new-destination', message: 'Registering new destination...' });
            return (await authenticatedFetch(`/connections/${connectionName}/destinations`, {
                method: 'POST',
                body: JSON.stringify(destination),
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
            })) as Destination;
        },
        onSuccess: () => {
            closeSnackbar('new-destination');
            queryClient.invalidateQueries({ queryKey: ['destinations'] });
            enqueueSnackbar({ message: 'Registered new destination', variant: 'success' });
        },

        onError: (error) => {
            closeSnackbar('new-destination');
            if (error instanceof Error && error.message) {
                enqueueSnackbar({ message: error.message, variant: 'error' });
            } else {
                enqueueSnackbar({ message: 'Encountered error registering destination', variant: 'error' });
            }
        },
    });
};
