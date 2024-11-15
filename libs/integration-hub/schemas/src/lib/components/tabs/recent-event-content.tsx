import { BrokerTypes } from '@eai-event-integration-platform/interfaces';
import { Box } from '@mui/material';
import { useAtomValue } from 'jotai';
import { activeRecentEventsTabAtom } from '../../atoms';
import { RecentEventsTab } from './recent-events';

export const recentEventsTabs = [
    {
        id: 'recentEvent-production',
        label: 'PRODUCTION',
        component: <RecentEventsTab broker={BrokerTypes.PRD} />,
    },
    {
        id: 'recentEvent-nonproduction',
        label: 'NON-PRODUCTION',
        component: <RecentEventsTab broker={BrokerTypes.NP} />,
    },
];

export const RecentEventsTabContent = () => {
    const activeRecentEventsTab = useAtomValue(activeRecentEventsTabAtom);

    return (
        <Box sx={{ width: '100%' }}>
            {recentEventsTabs.map(({ id, component }) => {
                return (
                    <div
                        key={id}
                        id={`tab-panel-event-${id}`}
                        hidden={id !== activeRecentEventsTab}
                        role="tabpanel"
                        aria-labelledby={id}
                    >
                        <Box sx={{ padding: 2 }}>{component}</Box>
                    </div>
                );
            })}
        </Box>
    );
};
