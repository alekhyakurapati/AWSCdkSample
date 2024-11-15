import { authAtom } from '@eai-event-integration-platform/auth-ui';
import { ButtonWithIcon, SearchBar } from '@eai-event-integration-platform/integration-hub/shared-ui';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import Check from '@mui/icons-material/Check';
import FilterListIcon from '@mui/icons-material/FilterList';
import ImportExportIcon from '@mui/icons-material/ImportExport';
import { ListItemIcon, Menu, MenuItem, Stack, Typography, useTheme } from '@mui/material';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { drawerOpenAtom, schemaSearchQueryAtom, schemaSortOptionAtom } from '../atoms';
import { SchemaSortingOption } from '../types';

export const CardListControls = () => {
    const setDrawerOpen = useSetAtom(drawerOpenAtom);
    const [sortOption, setSortOption] = useAtom(schemaSortOptionAtom);
    const [schemaSearchQuery, setSchemaSearchQuery] = useAtom(schemaSearchQueryAtom);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    useEffect(() => {
        setSchemaSearchQuery('');
    }, [setSchemaSearchQuery]);

    const { isUser } = useAtomValue(authAtom);
    const theme = useTheme();

    return (
        <>
            <Stack direction="row" spacing={1}>
                <SearchBar
                    placeholder="Search Schemas"
                    onChange={(e) => setSchemaSearchQuery(e.target.value)}
                    value={schemaSearchQuery}
                    onClear={() => setSchemaSearchQuery('')}
                />
                <ButtonWithIcon
                    disabled={!isUser}
                    variant="contained"
                    to="/events/schemas/create"
                    LinkComponent={Link}
                    startIcon={<AddOutlinedIcon />}
                >
                    <Typography noWrap>New Schema</Typography>
                </ButtonWithIcon>
            </Stack>
            <Stack direction="row" alignContent="center">
                <ButtonWithIcon
                    onClick={() => {
                        setDrawerOpen((state) => !state);
                    }}
                    startIcon={<FilterListIcon />}
                >
                    <Typography fontWeight="medium" color={theme.palette.primary.main}>
                        Filter
                    </Typography>
                </ButtonWithIcon>

                <ButtonWithIcon id="sort-menu-button" onClick={handleClick} startIcon={<ImportExportIcon />}>
                    <Typography fontWeight="medium" color={theme.palette.primary.main}>
                        Sort
                    </Typography>
                </ButtonWithIcon>

                <Menu
                    id="sort-menu-button"
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleClose}
                    MenuListProps={{
                        'aria-labelledby': 'sort-menu-button',
                    }}
                >
                    <MenuItem
                        onClick={() => {
                            setSortOption(SchemaSortingOption.ALPHABETICAL_ASC);
                            handleClose();
                        }}
                    >
                        <ListItemIcon>
                            {sortOption === SchemaSortingOption.ALPHABETICAL_ASC ? <Check /> : ''}
                        </ListItemIcon>
                        A to Z
                    </MenuItem>
                    <MenuItem
                        onClick={() => {
                            setSortOption(SchemaSortingOption.ALPHABETICAL_DESC);
                            handleClose();
                        }}
                    >
                        <ListItemIcon>
                            {sortOption === SchemaSortingOption.ALPHABETICAL_DESC ? <Check /> : ''}
                        </ListItemIcon>
                        Z to A
                    </MenuItem>
                    <MenuItem
                        onClick={() => {
                            setSortOption(SchemaSortingOption.LAST_UPDATED_DESC);
                            handleClose();
                        }}
                    >
                        <ListItemIcon>
                            {sortOption === SchemaSortingOption.LAST_UPDATED_DESC ? <Check /> : ''}
                        </ListItemIcon>
                        Recently Updated
                    </MenuItem>
                </Menu>
            </Stack>
        </>
    );
};
