import {
    useFetchAllApplications,
    useFetchDeliveryFailures,
} from '@eai-event-integration-platform/integration-hub/data';
import { BrokerTypes } from '@eai-event-integration-platform/interfaces';
import {
    Box,
    Button,
    Paper,
    Skeleton,
    Stack,
    Table,
    TableBody,
    TableContainer as MUITableContainer,
    Typography,
} from '@mui/material';
import { useAtomValue } from 'jotai';
import { Fragment } from 'react';
import {
    activeTabAtom,
    eventSourceAppFilterAtom,
    eventSubsIdFilterAtom,
    eventTargetArnFilterAtom,
    eventStartTimestampAtom,
    eventEndTimestampAtom,
} from '../atoms';
import { PayloadControl } from './payload-control';
import { TableHeader } from './table-header';
import { TableRows } from './table-rows';

export const TableContainer = () => {
    const { data: subscriberApplications } = useFetchAllApplications();
    const activeTab = useAtomValue(activeTabAtom);
    const eventSourceAppFilter = useAtomValue(eventSourceAppFilterAtom);
    const eventSubsIdFilter = useAtomValue(eventSubsIdFilterAtom);
    const eventTargetArnFilter = useAtomValue(eventTargetArnFilterAtom);
    const eventStartTimestamp = useAtomValue(eventStartTimestampAtom);
    const eventEndTimestamp = useAtomValue(eventEndTimestampAtom);

    const defaultApp = subscriberApplications ? subscriberApplications[0].ShortName : undefined;

    const {
        data: latestMessages,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        status,
    } = useFetchDeliveryFailures({
        broker: activeTab === 0 ? BrokerTypes.PRD : BrokerTypes.NP,
        subscriberApplication: eventSourceAppFilter || defaultApp,
        subscriptionId: eventSubsIdFilter,
        targetArn: eventTargetArnFilter,
        startEventTimestamp: eventStartTimestamp,
        endEventTimestamp: eventEndTimestamp,
    });

    if (status === 'error') return <Typography>Encountered an error, please try refreshing</Typography>;

    if (status === 'loading' || !latestMessages) {
        return (
            <Stack spacing={0.2} sx={{ marginTop: 2 }}>
                {Array(12)
                    .fill(null)
                    .map((_, i) => (
                        <Skeleton key={i} variant="rectangular" height={80} />
                    ))}
            </Stack>
        );
    }

    if (latestMessages?.pages[0].Data.length === 0) {
        return (
            <Box sx={{ marginTop: 2 }}>
                <Typography variant="subtitle1" textAlign="center">
                    No failure messages for {eventSourceAppFilter || defaultApp} app within the last 60 days.
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ marginTop: 2, paddingBottom: 2 }}>
            <MUITableContainer component={Paper} sx={{ overflowX: 'hidden' }}>
                <Table sx={{ mindWidth: 700, overflowX: 'hidden' }}>
                    <TableHeader />
                    <TableBody>
                        {latestMessages?.pages.map((group, i) => (
                            <Fragment key={i + BrokerTypes.PRD}>
                                {group.Data.map((row, index) => (
                                    <TableRows row={row} index={index} key={index} />
                                ))}
                            </Fragment>
                        ))}
                    </TableBody>
                </Table>
                {hasNextPage && (
                    <Box height="50px" alignItems="center" justifyContent="center" display="flex">
                        <Button onClick={() => fetchNextPage()}>
                            {isFetchingNextPage ? 'Loading...' : 'View More'}
                        </Button>
                    </Box>
                )}
                <PayloadControl />
            </MUITableContainer>
        </Box>
    );
};
