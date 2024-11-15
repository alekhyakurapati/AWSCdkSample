import {
    createRestTargetDialogAtom,
    subsApiConfirmExitDialogOpenAtom,
    targetAPIsFormVariantAtom,
} from '@eai-event-integration-platform/integration-hub/data';
import { TargetApisForm } from '@eai-event-integration-platform/integration-hub/rest-api';
import { ConfirmExitDialog } from '@eai-event-integration-platform/integration-hub/shared-ui';
import { Dialog, DialogContent } from '@mui/material';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { subscribingAppAtom, subscribingEnvAtom } from '../../../../atoms';

export const CreateRestTargetDialog = () => {
    const [isDialogOpen, setDialogOpen] = useAtom(createRestTargetDialogAtom);
    const setFormVariant = useSetAtom(targetAPIsFormVariantAtom);
    setFormVariant('createFromSubscriptionForm');

    const subscribingApp = useAtomValue(subscribingAppAtom);
    const subscribingEnv = useAtomValue(subscribingEnvAtom);

    const handleClose = () => {
        setDialogOpen(false);
    };

    const setConfirmExitDialog = useSetAtom(subsApiConfirmExitDialogOpenAtom);

    const handleConfirmDialogClose = () => {
        setConfirmExitDialog(false);
        setDialogOpen(false);
    };

    return (
        <>
            <ConfirmExitDialog
                dialogOpenAtom={subsApiConfirmExitDialogOpenAtom}
                handleNavigate={handleConfirmDialogClose}
            />
            <Dialog
                open={isDialogOpen}
                onClose={handleClose}
                aria-labelledby="create-rest-target-dialog-title"
                aria-describedby="create-rest-target-dialog-description"
            >
                <DialogContent>
                    <TargetApisForm appName={subscribingApp} prodType={subscribingEnv} />
                </DialogContent>
            </Dialog>
        </>
    );
};
