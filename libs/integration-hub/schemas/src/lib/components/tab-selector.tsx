import { Box, Tabs, Tab } from '@mui/material';
import { useAtom, useAtomValue } from 'jotai';
import { activeSchemaAtom, activeTabAtom } from '../atoms';
import { tabs } from './tab-content';
import { useFetchSchemaDetails } from '@eai-event-integration-platform/integration-hub/data';

export const TabSelector = () => {
    const [activeTab, setActiveTab] = useAtom(activeTabAtom);
    const activeSchema = useAtomValue(activeSchemaAtom);
    const { data: schema } = useFetchSchemaDetails(activeSchema);

    return (
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
                value={activeTab}
                onChange={(_, index) => {
                    setActiveTab(index);
                }}
                aria-label="schema-detail-tab-selector"
            >
                {tabs
                    .filter((tab) => {
                        if (!schema?.Subscriptions || schema?.Subscriptions.length === 0) {
                            return tab.id !== 'subscriptions';
                        }
                        return true;
                    })
                    .map(({ label }) => {
                        const id = label.toLowerCase().replace(' ', '-');

                        return <Tab key={id} label={label} id={`tab-${id}`} aria-controls={`tab-panel-${id}`} />;
                    })}
            </Tabs>
        </Box>
    );
};
