import { useAuthenticatedFetch } from '@eai-event-integration-platform/auth-ui';
import { Subscription } from '@eai-event-integration-platform/interfaces';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { closeSnackbar, enqueueSnackbar } from 'notistack';

export const useDeleteSubscription = () => {
    const authenticatedFetch = useAuthenticatedFetch();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (subscription: Subscription) => {
            enqueueSnackbar({ key: 'delete-subscription', message: 'Deleting subscription...' });
            await authenticatedFetch(`/subscriptions/${subscription.Name}`, {
                method: 'DELETE',
            });
        },
        onSuccess: (_, subscription) => {
            closeSnackbar('delete-subscription');
            queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
            queryClient.invalidateQueries({
                queryKey: ['schemas', subscription.SchemaName, subscription.SchemaVersion],
            });
            enqueueSnackbar({ message: 'Successfully deleted subscription', variant: 'success' });
        },

        onError: (error) => {
            closeSnackbar('delete-subscription');
            if (error instanceof Error && error.message) {
                enqueueSnackbar({ message: error.message, variant: 'error' });
            } else {
                enqueueSnackbar({ message: 'Encountered error deleting subscription', variant: 'error' });
            }
        },
    });
};
