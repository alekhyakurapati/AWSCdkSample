import { ConfirmExitDialog } from '@eai-event-integration-platform/integration-hub/shared-ui';
import { Box, Typography, useTheme } from '@mui/material';
import { useSetAtom } from 'jotai';
import { useLocation, useNavigate } from 'react-router-dom';
import { confirmExitDialogAtom } from '../atoms';
import { CreateRestTargetDialog } from '../components/form/sub-forms/target-details';
import { SubscriptionForm } from '../components/form/subscription-form';
import { FormVariant } from '../types';

interface SubscriptionFromViewProps {
    variant: FormVariant;
}

export const SubscriptionFormView = ({ variant }: SubscriptionFromViewProps) => {
    const { palette } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const isCreateForm = variant === 'create';
    const headerText = isCreateForm ? 'New Subscription' : 'Edit Subscription';
    const setDialogOpen = useSetAtom(confirmExitDialogAtom);

    return (
        <>
            <CreateRestTargetDialog />
            <ConfirmExitDialog
                dialogOpenAtom={confirmExitDialogAtom}
                handleNavigate={() => {
                    setDialogOpen(false);
                    navigate(location.state?.from ?? (isCreateForm ? '/events' : '/events/subscriptions'));
                }}
            />
            <Box sx={{ background: palette.grey[100], paddingX: { xs: 4, lg: 16, xl: 25 }, paddingY: 8 }}>
                <Typography marginBottom={2} variant="h1" color={palette.grey[800]}>
                    {headerText}
                </Typography>
                <SubscriptionForm variant={variant} />
            </Box>
        </>
    );
};
