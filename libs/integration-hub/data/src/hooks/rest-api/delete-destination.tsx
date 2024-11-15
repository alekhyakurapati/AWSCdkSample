import { useAuthenticatedFetch } from '@eai-event-integration-platform/auth-ui';
import { Destination } from '@eai-event-integration-platform/interfaces';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { closeSnackbar, enqueueSnackbar } from 'notistack';

export const useDeleteDestination = () => {
    const authenticatedFetch = useAuthenticatedFetch();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (destination: Destination) => {
            enqueueSnackbar({ key: 'delete-destination', message: 'Deleting destination...' });
            await authenticatedFetch(
                `/connections/${destination.ConnectionName}/destinations/${destination.DestinationName}`,
                {
                    method: 'DELETE',
                },
            );
        },
        onSuccess: (_, destinatioin) => {
            closeSnackbar('delete-destination');
            queryClient.invalidateQueries({ queryKey: ['destinations'] });
            enqueueSnackbar({
                message: `Successfully deleted destination ${destinatioin.DestinationName}`,
                variant: 'success',
            });
        },

        onError: (error) => {
            closeSnackbar('delete-destination');
            if (error instanceof Error && error.message) {
                enqueueSnackbar({ message: error.message, variant: 'error' });
            } else {
                enqueueSnackbar({ message: 'Encountered error deleting destination', variant: 'error' });
            }
        },
    });
};
