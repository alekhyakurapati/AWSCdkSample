import { Box, Typography, useTheme } from '@mui/material';
import { ReactNode } from 'react';

export const TabHeader = ({ children }: { children: ReactNode }) => {
    const theme = useTheme();
    return (
        <Typography
            variant="h4"
            height="27px"
            fontSize="23px"
            noWrap
            sx={{
                borderLeft: `${theme.palette.primary.main} solid 10px`,
                paddingLeft: '10px',
            }}
        >
            {children}
        </Typography>
    );
};
