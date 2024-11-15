import { useAuthenticatedFetch } from '@eai-event-integration-platform/auth-ui';
import { Subscription } from '@eai-event-integration-platform/interfaces';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { closeSnackbar, enqueueSnackbar } from 'notistack';

export const useUpdateSubscription = () => {
    const authenticatedFetch = useAuthenticatedFetch();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (subscription: Subscription & { Name: string }) => {
            enqueueSnackbar({ key: 'update-subscription', message: 'Updating subscription...' });
            await authenticatedFetch(`/subscriptions/${subscription.Name}`, {
                method: 'PUT',
                body: JSON.stringify(subscription),
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        },
        onSuccess: (_, subscription) => {
            closeSnackbar('update-subscription');
            queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
            queryClient.invalidateQueries({
                queryKey: ['schemas', subscription.SchemaName, subscription.SchemaVersion],
            });
            enqueueSnackbar({ message: 'Updated subscription', variant: 'success' });
        },

        onError: (error) => {
            closeSnackbar('update-subscription');
            if (error instanceof Error && error.message) {
                enqueueSnackbar({ message: error.message, variant: 'error' });
            } else {
                enqueueSnackbar({ message: 'Encountered error updating subscription', variant: 'error' });
            }
        },
    });
};
