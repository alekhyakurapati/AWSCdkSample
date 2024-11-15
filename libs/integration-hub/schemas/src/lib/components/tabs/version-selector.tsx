import { useFetchSchemaDetails } from '@eai-event-integration-platform/integration-hub/data';
import { ButtonWithIcon } from '@eai-event-integration-platform/integration-hub/shared-ui';
import { SchemaVersionState } from '@eai-event-integration-platform/interfaces';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CheckIcon from '@mui/icons-material/Check';
import { Box, ListItemIcon, ListItemText, Menu, MenuItem, Typography } from '@mui/material';
import { useAtomValue } from 'jotai';
import { MouseEvent, useState } from 'react';
import { activeSchemaAtom } from '../../atoms';
import { Link } from 'react-router-dom';

const stateLabel = (state: SchemaVersionState) => {
    switch (state) {
        case SchemaVersionState.DEPR:
            return '(Deprecated)';
        case SchemaVersionState.DRFT:
            return '(Draft)';
        case SchemaVersionState.PUBL:
            return '';
    }
};

export const VersionSelector = () => {
    const activeSchema = useAtomValue(activeSchemaAtom);
    const { data: schema } = useFetchSchemaDetails(activeSchema);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const isOpen = Boolean(anchorEl);

    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    if (!schema) return null;

    const { AvailableVersions } = schema;
    const currentVersion = activeSchema?.Version ?? 1;
    const currentState = AvailableVersions?.[currentVersion];
    const menuLabel = `Version ${currentVersion} ${stateLabel(currentState ?? SchemaVersionState.DRFT)}`;

    return (
        <Box>
            <ButtonWithIcon
                id="version-selector-button"
                aria-controls={isOpen ? 'version-selector-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={isOpen ? 'true' : undefined}
                onClick={handleClick}
                variant="outlined"
                color="primary"
                endIcon={<ArrowDropDownIcon />}
            >
                <Typography noWrap>{menuLabel}</Typography>
            </ButtonWithIcon>
            <Menu
                id="version-selector-menu"
                anchorEl={anchorEl}
                open={isOpen}
                onClose={handleClose}
                transformOrigin={{ horizontal: 0, vertical: -8 }}
                MenuListProps={{
                    'aria-labelledby': 'version-selector-button',
                }}
            >
                {Object.entries(AvailableVersions ?? []).map(([version, state]) => {
                    const isCurrentVersion = version === currentVersion?.toString() ?? '0';

                    return (
                        <MenuItem
                            key={version}
                            component={Link}
                            to={
                                isCurrentVersion
                                    ? ''
                                    : `/events/schemas/${encodeURIComponent(activeSchema?.SchemaName ?? '')}/${version}`
                            }
                            onClick={() => {
                                handleClose();
                            }}
                        >
                            {isCurrentVersion && (
                                <ListItemIcon>
                                    <CheckIcon fontSize="small" />
                                </ListItemIcon>
                            )}
                            <ListItemText inset={!isCurrentVersion}>{`Version ${version} ${stateLabel(
                                state,
                            )}`}</ListItemText>
                        </MenuItem>
                    );
                })}
            </Menu>
        </Box>
    );
};
