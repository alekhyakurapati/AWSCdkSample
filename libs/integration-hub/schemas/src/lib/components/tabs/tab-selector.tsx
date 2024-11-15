import { Box, Tab, Tabs } from '@mui/material';
import { useAtom } from 'jotai';
import { activeTabAtom } from '../../atoms';
import { tabs } from './tab-content';

export const TabSelector = () => {
    const [activeTab, setActiveTab] = useAtom(activeTabAtom);

    return (
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
                value={activeTab}
                onChange={(_, index) => setActiveTab(index)}
                aria-label="schema-detail-tab-selector"
            >
                {tabs.map(({ id, label }) => {
                    return <Tab key={id} value={id} label={label} id={`tab-${id}`} aria-controls={`tab-panel-${id}`} />;
                })}
            </Tabs>
        </Box>
    );
};
