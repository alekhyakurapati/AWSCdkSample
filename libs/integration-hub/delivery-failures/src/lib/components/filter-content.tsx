import { ButtonWithIcon, extractTargetArn } from '@eai-event-integration-platform/integration-hub/shared-ui';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { Box, MenuItem, MenuList, Paper, Popper, Typography, useTheme, Tooltip } from '@mui/material';
import { useAtom, useSetAtom } from 'jotai';
import { useState } from 'react';
import { eventCurrentFilterAtom, eventSubsIdFilterAtom, eventTargetArnFilterAtom } from '../atoms';
import { FilterOption } from '../types';

interface EventFailureFilterProps {
    filter: FilterOption;
}

export const FilterContent = ({ filter }: EventFailureFilterProps) => {
    const themeColor = useTheme().palette;
    const [filterAtomValue, setFilterAtomValue] = useAtom(filter.atom);
    const [eventCurrentFilter, setEventCurrentFilter] = useAtom(eventCurrentFilterAtom);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const setEventSubsIdFilter = useSetAtom(eventSubsIdFilterAtom);
    const setEventTargetArnFilter = useSetAtom(eventTargetArnFilterAtom);

    const handleSelectFilter = (item: string) => {
        setFilterAtomValue(item);
        setEventCurrentFilter(undefined);
    };

    return (
        <Box sx={{ marginLeft: 2 }}>
            <Tooltip title={filterAtomValue ? filterAtomValue : null}>
                <ButtonWithIcon
                    onClick={(event) => {
                        setEventCurrentFilter(eventCurrentFilter === filter.value ? undefined : filter.value);
                        setAnchorEl(event.currentTarget);
                    }}
                    endIcon={<ArrowDropDownIcon />}
                    variant="outlined"
                    sx={{ borderColor: themeColor.primary.main, maxWidth: 180 }}
                >
                    {filterAtomValue ? (
                        <Typography noWrap variant="body1" sx={{ maxWidth: 130 }}>
                            {extractTargetArn(filterAtomValue)}
                        </Typography>
                    ) : (
                        <Typography noWrap variant="body1">
                            {filter.title}
                        </Typography>
                    )}
                </ButtonWithIcon>
            </Tooltip>
            <Popper
                open={eventCurrentFilter === filter.value}
                placement="bottom-end"
                onBlur={() => {
                    setEventCurrentFilter(undefined);
                    setAnchorEl(null);
                }}
                anchorEl={anchorEl}
            >
                <Paper>
                    <Box style={{ maxHeight: '300px', overflow: 'auto' }}>
                        <MenuList>
                            {!filter.removeClearFilterOption && (
                                <MenuItem
                                    onClick={() => {
                                        setFilterAtomValue(undefined);
                                        setEventCurrentFilter(undefined);
                                    }}
                                >
                                    Clear filter
                                </MenuItem>
                            )}
                            {filter.options.map((item) =>
                                filter.title === 'Subscriber Application' ? (
                                    <MenuItem
                                        onClick={() => {
                                            handleSelectFilter(item);
                                            setEventSubsIdFilter(undefined);
                                            setEventTargetArnFilter(undefined);
                                        }}
                                        key={item}
                                    >
                                        {extractTargetArn(item)}
                                    </MenuItem>
                                ) : (
                                    <MenuItem
                                        onClick={() => {
                                            handleSelectFilter(item);
                                        }}
                                        key={item}
                                    >
                                        {extractTargetArn(item)}
                                    </MenuItem>
                                ),
                            )}
                        </MenuList>
                    </Box>
                </Paper>
            </Popper>
        </Box>
    );
};
