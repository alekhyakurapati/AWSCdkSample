import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';
import { DateTime } from 'luxon';
import { eventStartTimestampAtom, eventEndTimestampAtom, eventUpdatedTimestampAtom } from '../atoms';
import { useAtom, useSetAtom } from 'jotai';
import { useTheme, Typography } from '@mui/material';

export const DatePicker = () => {
    const themeColor = useTheme().palette;
    const [eventStartTimestamp, setEventStartTimestamp] = useAtom(eventStartTimestampAtom);
    const [eventEndTimestamp, setEventEndTimestamp] = useAtom(eventEndTimestampAtom);
    const setEventUpdatedTimestamp = useSetAtom(eventUpdatedTimestampAtom);

    const customizeProps = {
        '.MuiInputBase-input': {
            '&.MuiOutlinedInput-input': {
                padding: '7px 14px',
                color: themeColor.primary.main,
            },
        },
        '.MuiOutlinedInput-notchedOutline': {
            borderColor: themeColor.primary.main,
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: themeColor.primary.dark,
        },
        '.MuiInputLabel-formControl': {
            '&.MuiInputLabel-outlined': {
                color: themeColor.primary.main,
            },
        },
        '.MuiIconButton-edgeEnd': {
            '&.MuiIconButton-sizeMedium': {
                color: themeColor.primary.main,
            },
        },
        minWidth: 150,
    };

    return (
        <LocalizationProvider dateAdapter={AdapterLuxon}>
            <DesktopDatePicker
                key="startDate"
                label="Start Date"
                sx={customizeProps}
                format="DD"
                minDate={DateTime.utc().minus({ days: 60 })}
                maxDate={eventEndTimestamp || undefined}
                value={eventStartTimestamp || DateTime.utc().minus({ days: 60 })}
                disableFuture
                onAccept={(newValue) => {
                    setEventStartTimestamp(newValue);
                    setEventUpdatedTimestamp(true);
                }}
                // slotProps={{
                //     textField: {
                //         readOnly: true,
                //     },
                // }}
            />
            <Typography>-</Typography>
            <DesktopDatePicker
                key="endDate"
                label="End Date"
                sx={customizeProps}
                minDate={eventStartTimestamp || undefined}
                disableFuture
                value={eventEndTimestamp || DateTime.utc()}
                onAccept={(newValue) => {
                    setEventEndTimestamp(newValue);
                    setEventUpdatedTimestamp(true);
                }}
                format="DD"
                // slotProps={{
                //     textField: {
                //         readOnly: true,
                //     },
                // }}
            />
        </LocalizationProvider>
    );
};
