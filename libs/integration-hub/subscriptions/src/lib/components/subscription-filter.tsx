import { ButtonWithIcon } from '@eai-event-integration-platform/integration-hub/shared-ui';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { Box, MenuItem, MenuList, Paper, Popper, Typography } from '@mui/material';
import { useAtom } from 'jotai';
import { useState } from 'react';
import { currentFilterAtom } from '../atoms';
import { FilterOption } from '../types';

interface SubscriptionFilterProps {
    filter: FilterOption;
}

export const SubscriptionFilter = ({ filter }: SubscriptionFilterProps) => {
    const [filterAtomValue, setFilterAtomValue] = useAtom(filter.atom);
    const [currentFilter, setCurrentFilterAtom] = useAtom(currentFilterAtom);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    return (
        <Box sx={{ marginLeft: 2 }}>
            <ButtonWithIcon
                onClick={(event) => {
                    currentFilter === filter.title
                        ? setCurrentFilterAtom(undefined)
                        : setCurrentFilterAtom(filter.title);
                    setAnchorEl(event.currentTarget);
                }}
                endIcon={<ArrowDropDownIcon />}
                variant="outlined"
            >
                {filterAtomValue ? (
                    <Typography noWrap variant="body1">
                        {filterAtomValue}
                    </Typography>
                ) : (
                    <Typography noWrap variant="body1">
                        {filter.title}
                    </Typography>
                )}
            </ButtonWithIcon>
            <Popper
                open={currentFilter === filter.title}
                placement="bottom-end"
                onBlur={() => {
                    setCurrentFilterAtom(undefined);
                    setAnchorEl(null);
                }}
                anchorEl={anchorEl}
            >
                <Paper>
                    <MenuList>
                        <MenuItem
                            onClick={() => {
                                setFilterAtomValue(undefined);
                                setCurrentFilterAtom(undefined);
                            }}
                        >
                            Clear filter
                        </MenuItem>
                        {filter.options.map((item) => {
                            return (
                                <MenuItem
                                    onClick={() => {
                                        setFilterAtomValue(item);
                                        setCurrentFilterAtom(undefined);
                                    }}
                                    key={item}
                                >
                                    {item}
                                </MenuItem>
                            );
                        })}
                    </MenuList>
                </Paper>
            </Popper>
        </Box>
    );
};
