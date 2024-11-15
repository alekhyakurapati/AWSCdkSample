import { AppBar, Box, Toolbar, Typography, useTheme } from '@mui/material';
import { Link } from 'react-router-dom';
import { IntegrationHubLogo } from './integration-hub-logo';
import { NavMenu } from './navmenu';

export const NAVBAR_HEIGHT = 48;

export const Navbar = () => {
    const theme = useTheme();
    return (
        <AppBar
            sx={{
                background: theme.palette.primary.main,
                boxShadow: 'none',
                height: NAVBAR_HEIGHT,
                position: 'static',
            }}
        >
            <Toolbar sx={{ paddingRight: 2, width: '100vw' }} disableGutters variant="dense">
                <Link to="/">
                    <IntegrationHubLogo width={64} height={30} />
                </Link>
                <Box sx={{ flexGrow: 1, marginLeft: '24px' }}>
                    <Link to="/" style={{ textDecoration: 'none' }}>
                        <Typography variant="h5" color="white" letterSpacing={0.5}>
                            Integration Hub
                        </Typography>
                    </Link>
                </Box>
                <Box sx={{ marginRight: 2 }}>
                    <Link to="/docs" target="_blank" style={{ textDecoration: 'none' }}>
                        <Typography fontWeight="500" fontSize="15px" color="white" letterSpacing={0.5}>
                            Documentation
                        </Typography>
                    </Link>
                </Box>
                <NavMenu />
            </Toolbar>
        </AppBar>
    );
};
