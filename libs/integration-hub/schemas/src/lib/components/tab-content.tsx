import { useFetchSchemaDetails } from '@eai-event-integration-platform/integration-hub/data';
import { Box } from '@mui/material';
import { useAtomValue } from 'jotai';
import { activeSchemaAtom, activeTabAtom } from '../atoms';
import { EventExampleTab } from './tabs/event-example';
import { SchemaDefinitionTab } from './tabs/schema-definition';
import { SchemaSubscriptionsTab } from './tabs/schema-subscriptions';
import { SupportTab } from './tabs/support';

export const tabs = [
    {
        id: 'definition',
        label: 'SCHEMA DEFINITION',
        component: <SchemaDefinitionTab />,
    },
    {
        id: 'subscriptions',
        label: 'SUBSCRIPTIONS',
        component: <SchemaSubscriptionsTab />,
    },
    {
        id: 'examples',
        label: 'EVENT EXAMPLES',
        component: <EventExampleTab />,
    },
    {
        id: 'support',
        label: 'SUPPORT',
        component: <SupportTab />,
    },
];

export const TabContent = () => {
    const activeTab = useAtomValue(activeTabAtom);
    const activeSchema = useAtomValue(activeSchemaAtom);
    const { data: schema } = useFetchSchemaDetails(activeSchema);

    return (
        <Box sx={{ width: '100%' }}>
            {tabs
                .filter((tab) => {
                    if (!schema?.Subscriptions || schema?.Subscriptions.length === 0) {
                        return tab.id !== 'subscriptions';
                    }
                    return true;
                })
                .map(({ label, component }, index) => {
                    const id = label.toLowerCase().replace(' ', '-');

                    return (
                        <div
                            key={id}
                            id={`tab-panel-${id}`}
                            hidden={index !== activeTab}
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
