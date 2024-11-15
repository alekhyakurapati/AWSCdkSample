import AddCircleOutline from '@mui/icons-material/AddCircleOutline';
import { Button, Typography } from '@mui/material';
import { ReactNode } from 'react';

interface Props {
    handleFormAction: () => void;
    children: ReactNode;
}

export const FormActionButton = ({ handleFormAction, children }: Props) => (
    <Button variant="outlined" onClick={handleFormAction} startIcon={<AddCircleOutline />}>
        <Typography variant="body1">{children}</Typography>
    </Button>
);
