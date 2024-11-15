import { useAccount } from '@azure/msal-react';
import { authAtom } from '@eai-event-integration-platform/auth-ui';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { Divider, Menu, MenuItem, Typography } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ButtonWithIcon } from '../button-with-icon';

export const NavMenu = () => {
    const accountInfo = useAccount();
    const { isUser } = useAtomValue(authAtom);

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    return isUser ? (
        <>
            <ButtonWithIcon
                id="nav-menu-button"
                aria-controls={open ? 'nav-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}
                sx={{ color: 'white' }}
                endIcon={<ArrowDropDownIcon />}
            >
                <Typography fontWeight="500" fontSize="15px">
                    Manage
                </Typography>
            </ButtonWithIcon>

            <Menu
                id="nav-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                    'aria-labelledby': 'nav-menu-button',
                }}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: -16, horizontal: 300 }}
            >
                {accountInfo && <MenuItem disabled>{accountInfo?.name}</MenuItem>}
                <Divider />
                <MenuItem component={Link} to="/events/subscriptions" onClick={handleClose}>
                    Manage Subscriptions
                </MenuItem>
                <MenuItem component={Link} to="/events/targets/rest-api/authorisations" onClick={handleClose}>
                    Manage Target APIs and Authorisations
                </MenuItem>
                <MenuItem component={Link} to="/events/delivery-failures" onClick={handleClose}>
                    Manage Delivery Failures
                </MenuItem>
            </Menu>
        </>
    ) : null;
};
