import { Box, Tab, Tabs, Divider } from '@mui/material';
import { useAtom, useSetAtom } from 'jotai';
import { activeTabAtom, eventCurrentFilterAtom, eventSubsIdFilterAtom, eventTargetArnFilterAtom } from '../atoms';

export const tabs = [
    {
        id: 'production',
        label: 'Production',
    },
    {
        id: 'nonproduction',
        label: 'Non-Production',
    },
];

export const TabSelector = () => {
    const [activeTab, setActiveTab] = useAtom(activeTabAtom);
    const setEventCurrentFilter = useSetAtom(eventCurrentFilterAtom);
    const setEventSubsIdFilter = useSetAtom(eventSubsIdFilterAtom);
    const setEventTargetArnFilter = useSetAtom(eventTargetArnFilterAtom);

    return (
        <Box sx={{ width: '100%' }}>
            <Tabs
                value={activeTab}
                onChange={(_, index) => {
                    setActiveTab(index);
                    setEventCurrentFilter(undefined);
                    setEventSubsIdFilter(undefined);
                    setEventTargetArnFilter(undefined);
                }}
                aria-label="delivery-failures-tab-selector"
            >
                {tabs.map(({ id, label }) => {
                    return <Tab key={id} label={label} id={`tab-${id}`} aria-controls={`tab-panel-${id}`} />;
                })}
            </Tabs>
            <Divider sx={{ marginBottom: 2 }} />
        </Box>
    );
};
