import { Navbar } from '@eai-event-integration-platform/integration-hub/shared-ui';
import { Box } from '@mui/material';
import Routes from '../routes/routes';

export function App() {
    return (
        <Box sx={{ overflow: 'hidden' }}>
            <Navbar />
            <Routes />
        </Box>
    );
}

export default App;
