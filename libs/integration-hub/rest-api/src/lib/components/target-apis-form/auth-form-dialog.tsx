import { ConfirmExitDialog } from '@eai-event-integration-platform/integration-hub/shared-ui';
import { BrokerTypes } from '@eai-event-integration-platform/interfaces';
import Dialog from '@mui/material/Dialog';
import { useAtom, useSetAtom } from 'jotai';
import { authDialogConfirmExitDialogAtom, authFormDialogAtom } from '../../atoms';
import { AuthorisationForm } from '../auth-form/auth-form';

interface AuthorisationFormDialogProps {
    subscriberApplication: string;
    environment: BrokerTypes;
    onSaveAddAuthorisation: (authname: string) => void;
}
export const AuthorisationFormDialog = ({
    subscriberApplication,
    environment,
    onSaveAddAuthorisation,
}: AuthorisationFormDialogProps) => {
    const [authFormDialog, setAuthFormDialog] = useAtom(authFormDialogAtom);
    const setConfirmExitDialog = useSetAtom(authDialogConfirmExitDialogAtom);
    const onCloseAddAuthorisation = (isFormDirty?: boolean) => {
        if (isFormDirty) {
            setConfirmExitDialog(true);
        } else {
            setAuthFormDialog(false);
        }
    };

    const onCloseConfirmExitDialog = () => {
        setConfirmExitDialog(false);
        setAuthFormDialog(false);
    };

    return (
        <>
            <ConfirmExitDialog
                dialogOpenAtom={authDialogConfirmExitDialogAtom}
                handleNavigate={onCloseConfirmExitDialog}
            />
            <Dialog
                maxWidth="sm"
                fullWidth
                open={authFormDialog}
                onClose={() => setAuthFormDialog(false)}
                scroll="paper"
            >
                <AuthorisationForm
                    appName={subscriberApplication}
                    prodType={environment}
                    onSaveAddAuthorisation={onSaveAddAuthorisation}
                    onCancelAddAuthorisation={onCloseAddAuthorisation}
                ></AuthorisationForm>
            </Dialog>
        </>
    );
};
