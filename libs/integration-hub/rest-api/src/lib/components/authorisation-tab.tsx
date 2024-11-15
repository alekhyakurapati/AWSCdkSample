import { authAtom } from '@eai-event-integration-platform/auth-ui';
import {
    useDeleteConnection,
    useFetchConnections,
    useFetchDestinations,
} from '@eai-event-integration-platform/integration-hub/data';
import { ConfirmationDialog } from '@eai-event-integration-platform/integration-hub/shared-ui';
import { Box, Skeleton, Stack, Typography } from '@mui/material';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import * as lodash from 'lodash';
import { activeAuthorisationAtom, deleteConfirmationAuthorisationDialogAtom } from '../atoms';
import { AppAuthorisationsRow } from './app-authorisations-row';

export const AuthorisationTab = () => {
    const auth = useAtomValue(authAtom);
    const [activeAuthorisaion, setActiveAuthorisation] = useAtom(activeAuthorisationAtom);
    const setDialogOpen = useSetAtom(deleteConfirmationAuthorisationDialogAtom);
    const { mutate: deleteConnection } = useDeleteConnection();

    const {
        data: connections,
        isLoading: loadingConnections,
        isError: connectionsError,
    } = useFetchConnections({ userOwned: !auth.isAdmin });

    const {
        data: destinations,
        isLoading: loadingDestinations,
        isError: destinationsError,
    } = useFetchDestinations({ userOwned: !auth.isAdmin });

    const appGroupedConnections = lodash.groupBy(connections, 'AppName');
    const conNameGroupedDestinations = lodash.groupBy(destinations, 'ConnectionName');

    if (connectionsError || destinationsError)
        return <Typography>Encountered an error, please try refreshing</Typography>;

    if (loadingConnections || !connections || loadingDestinations || !destinations) {
        return (
            <Stack spacing={2}>
                {Array(12)
                    .fill(null)
                    .map((_, i) => (
                        <Skeleton key={i} variant="rectangular" height={220} />
                    ))}
            </Stack>
        );
    }

    const handleConfirmation = () => {
        if (activeAuthorisaion) {
            deleteConnection(activeAuthorisaion);
            setDialogOpen(false);
            setActiveAuthorisation(null);
        }
    };
    return (
        <>
            <ConfirmationDialog
                dialogOpenAtom={deleteConfirmationAuthorisationDialogAtom}
                handleConfirmation={handleConfirmation}
                title="Are you sure you want to delete this Authorisation"
                body={activeAuthorisaion?.ConnectionName}
                confirmationText="Delete"
                color="error"
            />
            <Box sx={{ alignItems: 'center' }}>
                <Stack>
                    {Object.entries(appGroupedConnections).map(([appName, connections], index) => (
                        <AppAuthorisationsRow
                            key={index}
                            authorisations={connections}
                            appName={appName}
                            destinations={conNameGroupedDestinations}
                        />
                    ))}
                </Stack>
            </Box>
        </>
    );
};
