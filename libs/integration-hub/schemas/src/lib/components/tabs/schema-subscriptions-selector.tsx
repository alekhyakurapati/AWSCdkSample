import { TabHeader } from '@eai-event-integration-platform/integration-hub/shared-ui';
import { Box, Stack, Tab, Tabs } from '@mui/material';
import { useAtom } from 'jotai';
import { activeSubscriptionTabAtom } from '../../atoms';
import { subsTabs } from './schema-subscriptions-content';
import { SchemaSubscriptionsTabContent } from './schema-subscriptions-content';

export const SchemaSubscriptionsTabSelector = () => {
    const [activeSubscriptionTab, setActiveSubscriptionTab] = useAtom(activeSubscriptionTabAtom);

    return (
        <>
            <TabHeader>Subscriptions</TabHeader>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                    value={activeSubscriptionTab}
                    onChange={(_, index) => setActiveSubscriptionTab(index)}
                    arial-label="subscription-detail-tab-selector"
                >
                    {subsTabs.map(({ id, label }) => {
                        return (
                            <Tab key={id} value={id} label={label} id={`tab-${id}`} aria-controls={`tab-panel-${id}`} />
                        );
                    })}
                </Tabs>
            </Box>
            <SchemaSubscriptionsTabContent />
        </>
    );
};
