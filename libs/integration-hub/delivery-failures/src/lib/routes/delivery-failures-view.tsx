import { BackButton, NAVBAR_HEIGHT } from '@eai-event-integration-platform/integration-hub/shared-ui';
import InfoIcon from '@mui/icons-material/Info';
import { Box, Link, Stack, Typography, useTheme } from '@mui/material';
import { useWindowSize } from 'usehooks-ts';
import { TabContent } from '../components/tab-content';
import { TabSelector } from '../components/tab-selector';

export const EventDeliveryFailuresView = () => {
    const theme = useTheme();
    const window = useWindowSize();

    return (
        <Box sx={{ minHeight: window.height - NAVBAR_HEIGHT, backgroundColor: theme.palette.grey[200] }}>
            <BackButton to="/events">Back to Catalog</BackButton>
            <Stack direction="column" sx={{ paddingX: 10, alignItems: 'center', display: 'flex' }}>
                <Typography variant="h2" sx={{ fontSize: 60, fontWeight: 'normal', marginTop: 5, marginBottom: 3 }}>
                    Manage Delivery Failures
                </Typography>
                <Box alignItems="center" display="flex">
                    <InfoIcon sx={{ fontSize: 20, marginRight: 1 }} />
                    <Typography variant="caption" sx={{ wordBreak: 'break-word' }}>
                        Delivery failures are retained for up to 60 days only. Failures exceeding 60 days are
                        automatically deleted from the log below
                    </Typography>
                </Box>
                <Typography variant="caption" sx={{ wordBreak: 'break-word' }}>
                    Contact&nbsp;
                    <Link
                        href="mailto:%3F%3FDL-IT-Integration-Platform-Support@woodside.com"
                        sx={{ wordBreak: 'break-word' }}
                    >
                        DL-IT-Integration-Platform-Support@woodside.com
                    </Link>
                    &nbsp;if you need to replay events.
                </Typography>
            </Stack>
            <Box sx={{ paddingX: 8, m: 'auto' }}>
                <TabSelector />
                <TabContent />
            </Box>
        </Box>
    );
};
