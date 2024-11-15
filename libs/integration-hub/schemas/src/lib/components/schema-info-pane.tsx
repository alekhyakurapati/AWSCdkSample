import { authAtom } from '@eai-event-integration-platform/auth-ui';
import { ButtonWithIcon } from '@eai-event-integration-platform/integration-hub/shared-ui';
import EditIcon from '@mui/icons-material/Edit';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { Chip, Divider, Skeleton, Stack, Typography, useTheme } from '@mui/material';
import { useAtomValue } from 'jotai';
import { Link, useLocation } from 'react-router-dom';
import { activeSchemaAtom } from '../atoms';
import { useFetchSchemaDetails } from '@eai-event-integration-platform/integration-hub/data';

export const SchemaInfoPane = () => {
    const activeSchema = useAtomValue(activeSchemaAtom);
    const { data: schema, isLoading } = useFetchSchemaDetails(activeSchema);
    const location = useLocation();
    const theme = useTheme();
    const { isAdmin, userRoles } = useAtomValue(authAtom);

    if (isLoading || !schema || !activeSchema) {
        return (
            <Stack>
                <Skeleton variant="text" height={184} />
            </Stack>
        );
    }

    const eventName = schema.SchemaName?.split('@').at(-1);
    const versionCount = Object.keys(schema.AvailableVersions ?? {}).length;
    const lastUpdated = new Date(schema.LastUpdated ?? '').toLocaleString('en-AU', { dateStyle: 'short' });
    const isLowClassification = schema.EventClassification === 'internal';
    const canEdit = userRoles.includes(schema.OwnerRole ?? '') || isAdmin;

    return (
        <Stack spacing={4} marginTop={4} marginBottom={2}>
            <Stack spacing={1.5}>
                <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    color={theme.palette.grey[700]}
                    height={4}
                    marginBottom={1}
                >
                    <Chip size="small" variant="filled" color="info" label={schema.AppName} />
                    <Typography noWrap sx={{ flexGrow: 1 }}>
                        / {schema.SchemaName}
                    </Typography>
                    {canEdit && (
                        <ButtonWithIcon
                            LinkComponent={Link}
                            to={`/events/schemas/${encodeURIComponent(activeSchema.SchemaName)}/edit`}
                            state={{ from: location }}
                            startIcon={<EditIcon />}
                            sx={{ flexShrink: 0 }}
                        >
                            Edit Schema Info
                        </ButtonWithIcon>
                    )}
                </Stack>
                <Typography variant="h1" noWrap>
                    {eventName}
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Chip size="small" label={`${versionCount} Version${versionCount > 1 ? 's' : ''}`} />
                    <Chip
                        size="small"
                        icon={isLowClassification ? <LockOpenIcon /> : <LockIcon />}
                        color={isLowClassification ? 'default' : 'warning'}
                        label={schema.EventClassification}
                        sx={{ textTransform: 'capitalize' }}
                    />
                    <Divider orientation="vertical" variant="inset" flexItem />
                    <Typography color={theme.palette.grey[700]} fontSize="small">
                        Last Updated {lastUpdated}
                    </Typography>
                </Stack>
            </Stack>
            <Stack spacing={0.5}>
                <Typography variant="body2" textTransform="uppercase" color={theme.palette.grey[600]}>
                    Description
                </Typography>
                <Typography color={theme.palette.grey[800]} variant="body1">
                    {schema.Description}
                </Typography>
            </Stack>
        </Stack>
    );
};
