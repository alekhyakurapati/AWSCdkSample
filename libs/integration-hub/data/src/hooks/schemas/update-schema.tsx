import { useAuthenticatedFetch } from '@eai-event-integration-platform/auth-ui';
import { SchemaDetails } from '@eai-event-integration-platform/interfaces';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { closeSnackbar, enqueueSnackbar } from 'notistack';

export const useUpdateSchema = () => {
    const authenticatedFetch = useAuthenticatedFetch();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (schema: SchemaDetails) => {
            const schemaName = schema.SchemaName;
            enqueueSnackbar({ key: schemaName, message: `Updating ${schemaName}` });

            return (await authenticatedFetch(`/schemas/${schemaName}`, {
                method: 'PUT',
                body: JSON.stringify(schema),
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
            })) as SchemaDetails;
        },
        onSuccess: (_data, schema) => {
            closeSnackbar(schema.SchemaName);
            queryClient.invalidateQueries({ queryKey: ['schemas'] });
            enqueueSnackbar({ message: `Updated ${schema.SchemaName}`, variant: 'success' });
        },

        onError: (error, schema) => {
            closeSnackbar(schema.SchemaName);
            if (error instanceof Error && error.message) {
                enqueueSnackbar({ message: error.message, variant: 'error' });
            } else {
                enqueueSnackbar({ message: `Encountered error updating ${schema.SchemaName}`, variant: 'error' });
            }
        },
    });
};
