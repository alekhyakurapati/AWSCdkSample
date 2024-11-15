import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { IconButton, InputAdornment, TextField } from '@mui/material';
import { ChangeEventHandler } from 'react';

interface Props {
    placeholder?: string;
    onChange: ChangeEventHandler<HTMLTextAreaElement | HTMLInputElement>;
    value?: string;
    onClear: () => void;
}

export const SearchBar = (props: Props) => {
    const startAdornment = props.value ? undefined : (
        <InputAdornment position="start" sx={{ paddingBottom: 2 }}>
            <SearchIcon />
        </InputAdornment>
    );
    const endAdornment = props.value ? (
        <IconButton onClick={props.onClear}>
            <ClearIcon />
        </IconButton>
    ) : undefined;

    return (
        <TextField
            {...props}
            variant="filled"
            InputProps={{
                disableUnderline: true,
                startAdornment: startAdornment,
                endAdornment: endAdornment,
            }}
            sx={{
                flexGrow: 1,
                '& .MuiFilledInput-root': {
                    borderRadius: 1.5,
                },
                '& .MuiFilledInput-input': { paddingY: 1 },
            }}
        />
    );
};
