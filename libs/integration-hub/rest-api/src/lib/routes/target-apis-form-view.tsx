import { ConfirmExitDialog, NAVBAR_HEIGHT } from '@eai-event-integration-platform/integration-hub/shared-ui';
import { Box, Typography, useTheme } from '@mui/material';
import { useSetAtom } from 'jotai';
import { useNavigate } from 'react-router-dom';
import { apiViewConfirmExitDialogOpenAtom } from '../atoms';
import { targetAPIsFormVariantAtom, TargetAPIsFormVariant } from '@eai-event-integration-platform/integration-hub/data';
import { TargetApisForm } from '../components/target-apis-form/target-apis-form';
import { useWindowSize } from 'usehooks-ts';

export interface TargetApisFormViewProps {
    variant: TargetAPIsFormVariant;
}

export const TargetApisFormView = ({ variant }: TargetApisFormViewProps) => {
    const screen = useWindowSize();
    const navigate = useNavigate();
    const { palette } = useTheme();
    const setFormVariant = useSetAtom(targetAPIsFormVariantAtom);
    const setConfirmExitDialog = useSetAtom(apiViewConfirmExitDialogOpenAtom);

    const title = variant === 'create' ? 'Add Rest API' : 'Edit Rest API';
    setFormVariant(variant);

    const handleConfirmDialogClose = () => {
        setConfirmExitDialog(false);
        navigate('/events/targets/rest-api/');
    };

    return (
        <>
            <ConfirmExitDialog
                dialogOpenAtom={apiViewConfirmExitDialogOpenAtom}
                handleNavigate={handleConfirmDialogClose}
            />
            <Box
                sx={{
                    background: palette.grey[100],
                    minHeight: screen.height - NAVBAR_HEIGHT,
                    paddingX: { xs: 4, lg: 16, xl: 25 },
                    paddingY: 8,
                }}
            >
                <Typography variant="h1" color={palette.grey[800]} marginBottom={2}>
                    {title}
                </Typography>

                <TargetApisForm />
            </Box>
        </>
    );
};
