import { BrokerTypes } from '@eai-event-integration-platform/interfaces';
import { Box } from '@mui/material';
import { useAtomValue } from 'jotai';
import { activeSubscriptionTabAtom } from '../../atoms';
import { SchemaSubscriptionsTab } from './schema-subscriptions';

export const subsTabs = [
    { id: 'subs-production', label: 'PRODUCTION', component: <SchemaSubscriptionsTab broker={BrokerTypes.PRD} /> },
    {
        id: 'subs-nonproduction',
        label: 'NON-PRODUCTION',
        component: <SchemaSubscriptionsTab broker={BrokerTypes.NP} />,
    },
];

export const SchemaSubscriptionsTabContent = () => {
    const activeSubscriptionTab = useAtomValue(activeSubscriptionTabAtom);

    return (
        <Box sx={{ width: '100%' }}>
            {subsTabs.map(({ id, component }) => {
                return (
                    <div
                        key={id}
                        id={`tab-panel-subs-${id}`}
                        hidden={id !== activeSubscriptionTab}
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
