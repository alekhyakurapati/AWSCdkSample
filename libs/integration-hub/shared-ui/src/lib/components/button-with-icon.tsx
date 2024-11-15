import { Button, ButtonProps, Stack, Typography } from '@mui/material';
import { LinkProps } from 'react-router-dom';

export const ButtonWithIcon = ({
    startIcon,
    endIcon,
    children,
    ...props
}: ButtonProps & Partial<Omit<LinkProps, keyof ButtonProps>>) => {
    return (
        <Button {...props}>
            <Stack direction="row" alignItems="end" spacing={1}>
                {startIcon}
                <Typography variant="button">{children}</Typography>
                {endIcon}
            </Stack>
        </Button>
    );
};
