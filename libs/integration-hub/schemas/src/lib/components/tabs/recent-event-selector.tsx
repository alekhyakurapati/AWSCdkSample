import { TabHeader } from '@eai-event-integration-platform/integration-hub/shared-ui';
import { Box, Tab, Tabs } from '@mui/material';
import { useAtom } from 'jotai';
import { activeRecentEventsTabAtom } from '../../atoms';
import { RecentEventsTabContent, recentEventsTabs } from './recent-event-content';

export const RecentEventsTabSelector = () => {
    const [activeRecentEventsTab, setActiveRecentEventsTab] = useAtom(activeRecentEventsTabAtom);

    return (
        <>
            <TabHeader>Recent Events</TabHeader>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                    value={activeRecentEventsTab}
                    onChange={(_, index) => setActiveRecentEventsTab(index)}
                    arial-label="recent-events-detail-tab-selector"
                >
                    {recentEventsTabs.map(({ id, label }) => {
                        return (
                            <Tab key={id} value={id} label={label} id={`tab-${id}`} aria-controls={`tab-panel-${id}`} />
                        );
                    })}
                </Tabs>
            </Box>
            <RecentEventsTabContent />
        </>
    );
};
