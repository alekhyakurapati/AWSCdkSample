import { FormControl, Select as MuiSelect, SelectProps as MuiSelectProps } from '@mui/material';
import { useController } from 'react-hook-form';

type SelectProps = MuiSelectProps & {
    name: string;
};

export const Select = ({ name, ...props }: SelectProps) => {
    const { field } = useController({ name });

    return (
        <FormControl>
            <MuiSelect displayEmpty {...props} {...field} />
        </FormControl>
    );
};
