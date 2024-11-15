import { Stack, Typography } from '@mui/material';
import { ReactNode } from 'react';

interface LabeledFormInputProps {
    label: string;
    tooltip?: ReactNode;
    input: ReactNode;
    errorMessage?: ReactNode;
    width?: string | number;
}

export const FORM_INPUT_WIDTH = 500;

export const LabeledFormInput = ({
    label,
    tooltip,
    input,
    errorMessage,
    width = FORM_INPUT_WIDTH,
}: LabeledFormInputProps) => (
    <Stack spacing={2} sx={{ width }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            <Typography variant="h5">{label}</Typography>
            {tooltip}
        </Stack>
        {input}
        {errorMessage}
    </Stack>
);
