import { useDeleteSubscription, useUpdateSubscription } from '@eai-event-integration-platform/integration-hub/data';
import {
    BackButton,
    ConfirmationDialog,
    NAVBAR_HEIGHT,
} from '@eai-event-integration-platform/integration-hub/shared-ui';
import { Subscription, SubscriptionState } from '@eai-event-integration-platform/interfaces';
import { Box, Stack, Typography, useTheme } from '@mui/material';
import { useAtom, useSetAtom } from 'jotai';
import { useWindowSize } from 'usehooks-ts';
import { activeSubscriptionAtom, deleteConfirmationDialogAtom, disableConfirmationDialogAtom } from '../atoms';
import { SubscriptionControls } from '../components/subscription-controls';
import { SubscriptionList } from '../components/subscription-list';

export function ManageSubscriptionsView() {
    const theme = useTheme();
    const window = useWindowSize();
    const { mutate: deleteSubscription } = useDeleteSubscription();
    const { mutate: updateSubscription } = useUpdateSubscription();
    const [activeSubscription, setActiveSubscription] = useAtom(activeSubscriptionAtom);
    const setDeleteDialogOpen = useSetAtom(deleteConfirmationDialogAtom);
    const setDisableDialogOpen = useSetAtom(disableConfirmationDialogAtom);

    const handleDeleteConfirmation = () => {
        if (activeSubscription) {
            deleteSubscription(activeSubscription);
            setDeleteDialogOpen(false);
            setActiveSubscription(null);
        }
    };

    const handleDisableConfirmation = () => {
        if (activeSubscription) {
            updateSubscription({
                ...activeSubscription,
                State: SubscriptionState.DISABLED,
            } as Subscription & { Name: string });

            setDisableDialogOpen(false);
            setActiveSubscription(null);
        }
    };

    return (
        <>
            <ConfirmationDialog
                dialogOpenAtom={deleteConfirmationDialogAtom}
                handleConfirmation={handleDeleteConfirmation}
                title="Are you sure you want to delete this subscription?"
                body={activeSubscription?.Name}
                confirmationText="Delete"
                color="error"
            />
            <ConfirmationDialog
                dialogOpenAtom={disableConfirmationDialogAtom}
                handleConfirmation={handleDisableConfirmation}
                title="Are you sure you want to disable this subscription?"
                body={activeSubscription?.Name}
                confirmationText="Disable"
            />
            <BackButton to="/events">Back to Catalog</BackButton>
            <Box sx={{ minHeight: window.height - NAVBAR_HEIGHT, backgroundColor: theme.palette.grey[200] }}>
                <Stack sx={{ paddingLeft: 10, paddingRight: 10 }}>
                    <Box sx={{ marginTop: 5, marginBottom: 5, display: 'flex', justifyContent: 'center' }}>
                        <Typography variant="h2" sx={{ fontSize: 60, fontWeight: 'normal' }}>
                            Manage Subscriptions
                        </Typography>
                    </Box>
                    <SubscriptionControls />
                    <SubscriptionList />
                </Stack>
            </Box>
        </>
    );
}

export default ManageSubscriptionsView;
