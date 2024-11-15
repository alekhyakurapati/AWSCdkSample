import CancelIcon from '@mui/icons-material/Cancel';
import { Dialog, DialogContent, IconButton } from '@mui/material';
import { useAtom } from 'jotai';
import { currentFailureMessageAtom, viewPayloadDialogOpenAtom } from '../atoms';
import { PayloadDetail } from './payload-details';

export const PayloadControl = () => {
    const [currentFailureMessage, setCurrentFailureMessage] = useAtom(currentFailureMessageAtom);
    const [viewPayloadDialogOpen, setViewPayloadDialogOpen] = useAtom(viewPayloadDialogOpenAtom);

    return (
        <Dialog
            open={viewPayloadDialogOpen}
            onClose={() => {
                setCurrentFailureMessage(undefined);
                setViewPayloadDialogOpen(false);
            }}
            maxWidth="lg"
            fullWidth
            disableEscapeKeyDown
            aria-labelledby="parent-dialog-title"
            aria-describedby="parent-dialog-description"
        >
            <IconButton
                color="secondary"
                sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    backgroundColor: 'transparent',
                    zIndex: '1',
                }}
                aria-label="close button"
                onClick={() => {
                    setCurrentFailureMessage(undefined);
                    setViewPayloadDialogOpen(false);
                }}
            >
                <CancelIcon />
            </IconButton>
            <DialogContent sx={{ maxHeight: '70vh' }}>{currentFailureMessage && <PayloadDetail />}</DialogContent>
        </Dialog>
    );
};
