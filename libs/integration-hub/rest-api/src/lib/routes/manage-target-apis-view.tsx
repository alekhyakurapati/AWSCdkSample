import { BackButton, NAVBAR_HEIGHT } from '@eai-event-integration-platform/integration-hub/shared-ui';
import { Box, Stack, Typography, useTheme } from '@mui/material';
import { useSetAtom } from 'jotai';
import { useWindowSize } from 'usehooks-ts';
import { activeTabAtom } from '../atoms';
import { TabContent } from '../components/tab-content';
import { TabVariant } from '../types';

const MAX_WIDTH = 1152;

export interface ManageTargetApisViewProps {
    variant: TabVariant;
}

export function ManageTargetApisView({ variant }: ManageTargetApisViewProps) {
    const theme = useTheme();
    const window = useWindowSize();
    const setActiveTab = useSetAtom(activeTabAtom);

    setActiveTab(variant === 'Auth' ? 0 : 1);

    return (
        <Box sx={{ minHeight: window.height - NAVBAR_HEIGHT, backgroundColor: theme.palette.grey[200] }}>
            <BackButton to="/events">Back to Catalog</BackButton>
            <Stack
                spacing={5}
                sx={{
                    alignItems: 'center',
                    paddingX: { xs: 4, lg: 16, xl: 25 },
                    paddingY: 8,
                }}
            >
                <Typography sx={{ fontSize: '60px', textAlign: 'center' }}>
                    Manage Authorisations & Target APIs
                </Typography>
            </Stack>
            <Stack sx={{ maxWidth: MAX_WIDTH, m: 'auto' }}>
                <TabContent />
            </Stack>
        </Box>
    );
}

export default ManageTargetApisView;
