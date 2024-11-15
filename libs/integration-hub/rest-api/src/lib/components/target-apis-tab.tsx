import { authAtom } from '@eai-event-integration-platform/auth-ui';
import {
    useDeleteDestination,
    useFetchDestinations,
    useFetchSubscriptions,
} from '@eai-event-integration-platform/integration-hub/data';
import { ConfirmationDialog } from '@eai-event-integration-platform/integration-hub/shared-ui';
import { Box, Skeleton, Stack, Typography } from '@mui/material';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import * as lodash from 'lodash';
import { activeTargetApiAtom, deleteConfirmationTargetApiDialogAtom } from '../atoms';
import { AppTargetApisRow } from './app-target-apis-row';

export const TargetAPIsTab = () => {
    const auth = useAtomValue(authAtom);
    const [activeTargetApi, setActiveTargetApi] = useAtom(activeTargetApiAtom);
    const setDialogOpen = useSetAtom(deleteConfirmationTargetApiDialogAtom);
    const { mutate: deleteDestination } = useDeleteDestination();

    const {
        data: destinations,
        isLoading: loadingDestinations,
        isError: destinationsError,
    } = useFetchDestinations({ userOwned: !auth.isAdmin });
    const {
        data: subscriptions,
        isLoading: loadingSubscriptions,
        isError: subscriptionsError,
    } = useFetchSubscriptions();

    const appGroupedDestinations = lodash.groupBy(destinations, 'AppName');
    const appGroupedSubscriprions = lodash.groupBy(subscriptions, 'AppName');

    if (destinationsError || subscriptionsError)
        return <Typography>Encountered an error, please try refreshing</Typography>;

    if (loadingDestinations || !destinations || loadingSubscriptions || !subscriptions) {
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
        if (activeTargetApi) {
            deleteDestination(activeTargetApi);
            setDialogOpen(false);
            setActiveTargetApi(null);
        }
    };

    return (
        <>
            <ConfirmationDialog
                dialogOpenAtom={deleteConfirmationTargetApiDialogAtom}
                handleConfirmation={handleConfirmation}
                title="Are you sure you want to delete this Target API?"
                body={activeTargetApi?.DestinationName}
                confirmationText="Delete"
                color="error"
            />
            <Box sx={{ alignItems: 'center' }}>
                <Stack>
                    {Object.entries(appGroupedDestinations).map(([appName, destinations], index) => (
                        <AppTargetApisRow
                            key={index}
                            restApis={destinations}
                            appName={appName}
                            subscriptions={appGroupedSubscriprions[appName]}
                        />
                    ))}
                </Stack>
            </Box>
        </>
    );
};
