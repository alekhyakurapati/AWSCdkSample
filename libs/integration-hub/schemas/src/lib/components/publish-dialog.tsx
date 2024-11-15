import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Typography,
} from '@mui/material';
import { useAtom, useAtomValue } from 'jotai';
import { activeSchemaAtom, publishDialogOpenAtom } from '../atoms';
import { useFetchSchemaDetails, usePublishSchema } from '@eai-event-integration-platform/integration-hub/data';

export const PublishDialog = () => {
    const activeSchema = useAtomValue(activeSchemaAtom);
    const { data: schema } = useFetchSchemaDetails(activeSchema);
    const { mutate } = usePublishSchema(activeSchema);
    const [isDialogOpen, setDialogOpen] = useAtom(publishDialogOpenAtom);

    const handlePublish = () => {
        mutate();
        setDialogOpen(false);
    };

    const handleClose = () => {
        setDialogOpen(false);
    };

    if (!schema) return null;

    return (
        <Dialog
            open={isDialogOpen}
            onClose={handleClose}
            aria-labelledby="publish-schema-dialog-title"
            aria-describedby="publish-schema-dialog-description"
        >
            <DialogTitle id="publish-schema-dialog-title">Ready to publish schema to production?</DialogTitle>
            <DialogContent>
                <DialogContentText id="publish-schema-dialog-description">
                    <span>You're publishing</span>{' '}
                    <Typography component="span" color="secondary" sx={{ wordBreak: 'break-all' }}>
                        {schema.SchemaName}
                    </Typography>
                    <span>
                        . Once published, the event will become available for subscription in <b>production</b>.
                    </span>
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button variant="contained" onClick={handlePublish} autoFocus>
                    Publish
                </Button>
            </DialogActions>
        </Dialog>
    );
};
