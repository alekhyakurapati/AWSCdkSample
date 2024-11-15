import { useAuthenticatedFetch } from '@eai-event-integration-platform/auth-ui';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { closeSnackbar, enqueueSnackbar } from 'notistack';
import { Destination } from '@eai-event-integration-platform/interfaces';

export const useUpdateDestination = (oldConnectionName: string | undefined) => {
    const authenticatedFetch = useAuthenticatedFetch();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (destination: Destination) => {
            const destinationName = destination.DestinationName;
            enqueueSnackbar({ key: destinationName, message: `Updating ${destinationName}` });

            await authenticatedFetch(`/connections/${oldConnectionName}/destinations/${destinationName}`, {
                method: 'PUT',
                body: JSON.stringify(destination),
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
            });
        },
        onSuccess: (_data, destination) => {
            closeSnackbar(destination.DestinationName);
            queryClient.invalidateQueries({ queryKey: ['destinations'] });
            enqueueSnackbar({ message: `Updated ${destination.DestinationName}`, variant: 'success' });
        },

        onError: (error, destination) => {
            closeSnackbar(destination.DestinationName);
            if (error instanceof Error && error.message) {
                enqueueSnackbar({ message: error.message, variant: 'error' });
            } else {
                enqueueSnackbar({
                    message: `Encountered error updating ${destination.DestinationName}`,
                    variant: 'error',
                });
            }
        },
    });
};
