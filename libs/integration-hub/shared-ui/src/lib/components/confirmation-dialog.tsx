import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { PrimitiveAtom, useAtom } from 'jotai';

interface Props {
    dialogOpenAtom: PrimitiveAtom<boolean>;
    handleConfirmation: () => void;
    title?: string;
    body?: string;
    confirmationText: string;
    color?: 'primary' | 'error';
}

export const ConfirmationDialog = ({
    dialogOpenAtom,
    handleConfirmation,
    title,
    body,
    confirmationText,
    color = 'primary',
}: Props) => {
    const [isDialogOpen, setDialogOpen] = useAtom(dialogOpenAtom);
    const handleClose = () => setDialogOpen(false);

    return (
        <Dialog
            open={isDialogOpen}
            onClose={handleClose}
            aria-labelledby="confirm-exit-dialog-title"
            aria-describedby="confirm-exit-dialog-description"
        >
            {title && <DialogTitle id="confirm-exit-dialog-title">{title}</DialogTitle>}
            {body && (
                <DialogContent>
                    <DialogContentText id="confirm-exit-dialog-description">{body}</DialogContentText>
                </DialogContent>
            )}
            <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button color={color} variant="contained" onClick={handleConfirmation} autoFocus>
                    {confirmationText}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
