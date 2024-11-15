import Box from '@mui/material/Box';
import { useAtomValue } from 'jotai';
import { activeTabAtom } from '../../atoms';
import { SchemaDefinitionTab } from '../tabs/schema-definition';
import { EventExampleTab } from './event-example';
import { SchemaSubscriptionsTabSelector } from './schema-subscriptions-selector';
import { SupportTab } from './support';
import { RecentEventsTabSelector } from './recent-event-selector';

export const tabs = [
    { id: 'definition', label: 'SCHEMA DEFINITION', component: <SchemaDefinitionTab /> },
    { id: 'subscriptions', label: 'SUBSCRIPTIONS', component: <SchemaSubscriptionsTabSelector /> },
    { id: 'recent', label: 'RECENT EVENTS', component: <RecentEventsTabSelector /> },
    { id: 'examples', label: 'EVENT EXAMPLES', component: <EventExampleTab /> },
    { id: 'support', label: 'SUPPORT', component: <SupportTab /> },
];

export const TabContent = () => {
    const activeTab = useAtomValue(activeTabAtom);

    return (
        <Box sx={{ width: '100%' }}>
            {tabs.map(({ id, component }) => {
                return (
                    <div key={id} id={`tab-panel-${id}`} hidden={id !== activeTab} role="tabpanel" aria-labelledby={id}>
                        <Box sx={{ padding: 2 }}>{component}</Box>
                    </div>
                );
            })}
        </Box>
    );
};
