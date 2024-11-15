import { Box } from '@mui/material';
import { TableContainer } from './table-container';
import { FilterControl } from './filter-control';
import { useAtomValue } from 'jotai';
import { activeTabAtom } from '../atoms';
import { BrokerTypes } from '@eai-event-integration-platform/interfaces';

export const TabContent = () => {
    const activeTab = useAtomValue(activeTabAtom);

    return (
        <Box sx={{ width: '100%' }}>
            <FilterControl broker={activeTab === 0 ? BrokerTypes.PRD : BrokerTypes.NP} key={activeTab} />
            <TableContainer />
        </Box>
    );
};
