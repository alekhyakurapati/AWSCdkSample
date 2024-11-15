import { useAuthenticatedFetch } from '@eai-event-integration-platform/auth-ui';
import { Subscription } from '@eai-event-integration-platform/interfaces';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { closeSnackbar, enqueueSnackbar } from 'notistack';

export const useCreateSubscription = () => {
    const authenticatedFetch = useAuthenticatedFetch();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (subscription: Subscription) => {
            enqueueSnackbar({ key: 'new-subscription', message: 'Registering new subscription...' });
            await authenticatedFetch('/subscriptions', {
                method: 'POST',
                body: JSON.stringify(subscription),
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        },
        onSuccess: (_, subscription) => {
            closeSnackbar('new-subscription');
            queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
            queryClient.invalidateQueries({
                queryKey: ['schemas', subscription.SchemaName, subscription.SchemaVersion],
            });
            enqueueSnackbar({ message: 'Registered new subscription', variant: 'success' });
        },

        onError: (error) => {
            closeSnackbar('new-subscription');
            if (error instanceof Error && error.message) {
                enqueueSnackbar({ message: error.message, variant: 'error' });
            } else {
                enqueueSnackbar({ message: 'Encountered error registering subscription', variant: 'error' });
            }
        },
    });
};
