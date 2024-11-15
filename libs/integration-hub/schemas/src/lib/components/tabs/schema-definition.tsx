import { authAtom } from '@eai-event-integration-platform/auth-ui';
import { useFetchSchemaDetails } from '@eai-event-integration-platform/integration-hub/data';
import { ButtonWithIcon, TabHeader } from '@eai-event-integration-platform/integration-hub/shared-ui';
import { SchemaVersionState } from '@eai-event-integration-platform/interfaces';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import { Box, Button, Divider, Skeleton, Stack, Typography, useTheme } from '@mui/material';
import { useAtomValue, useSetAtom } from 'jotai';
import { Link, useLocation } from 'react-router-dom';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { nord } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { activeSchemaAtom, publishDialogOpenAtom } from '../../atoms';
import { VersionSelector } from './version-selector';

export const SchemaDefinitionTab = () => {
    const activeSchema = useAtomValue(activeSchemaAtom);
    const { data: schema, isError, isLoading } = useFetchSchemaDetails(activeSchema);
    const theme = useTheme();
    const setDialogOpen = useSetAtom(publishDialogOpenAtom);
    const location = useLocation();
    const { isAdmin, isUser, userRoles } = useAtomValue(authAtom);

    if (isLoading || !activeSchema) {
        return (
            <Stack>
                <Skeleton variant="text" height={184} />
            </Stack>
        );
    }

    if (isError || !schema) return null;

    const handleDownload = (filename: string, json: string) => {
        const anchor = document.createElement('a');
        const blob = new Blob([json], { type: 'application/json' });
        anchor.href = URL.createObjectURL(blob);
        anchor.download = `${filename}.json`;
        anchor.click();
    };

    const isDeprecated = schema.State === SchemaVersionState.DEPR;
    const isDraft = schema.State === SchemaVersionState.DRFT;
    const isPublished = schema.State === SchemaVersionState.PUBL;
    const isOwner = userRoles.includes(schema.OwnerRole ?? '');
    const canEdit =
        (isOwner || isAdmin) &&
        (isDraft ||
            // Published version is current latest available
            (schema.State === SchemaVersionState.PUBL &&
                parseInt(schema.Version ?? '1') === Object.keys(schema.AvailableVersions ?? {}).length));

    return (
        <Stack spacing={3}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                <Stack direction="row" alignItems="center" spacing={2}>
                    <TabHeader>Schema Definition</TabHeader>
                    <VersionSelector />
                </Stack>
                <Stack direction="row" alignItems="center" spacing={2}>
                    {!isDeprecated && (
                        <Button
                            disabled={!isUser}
                            to="/events/subscriptions/create"
                            state={{ activeSchema, prodType: 'NP', from: location }}
                            component={Link}
                            variant="outlined"
                        >
                            <Typography>Subscribe Non-Production</Typography>
                        </Button>
                    )}
                    {isPublished && (
                        <Button
                            disabled={!isUser}
                            component={Link}
                            to="/events/subscriptions/create"
                            state={{ activeSchema, prodType: 'PRD', from: location }}
                            variant="contained"
                        >
                            <Typography>Subscribe Production</Typography>
                        </Button>
                    )}
                </Stack>
            </Stack>
            <Box sx={{ background: 'rgb(46, 52, 64)', borderRadius: 4, color: theme.palette.grey[200] }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ marginX: 2, marginY: 1.5 }}>
                    <Stack direction="row" spacing={1} sx={{ flexGrow: 1 }}>
                        <Typography component="span" fontWeight={500}>
                            Last updated
                        </Typography>
                        <Typography component="span" fontWeight={300}>
                            {new Date(schema.LastUpdated ?? '').toLocaleString('en-au', {
                                dateStyle: 'medium',
                            })}
                        </Typography>
                    </Stack>
                    <ButtonWithIcon
                        onClick={() => handleDownload(schema.SchemaName ?? 'schema', schema.Content ?? '{}')}
                        color="info"
                        startIcon={<DownloadIcon />}
                    >
                        Download
                    </ButtonWithIcon>
                    {canEdit && (
                        <ButtonWithIcon
                            color="info"
                            startIcon={<EditIcon />}
                            LinkComponent={Link}
                            to={`/events/schemas/${encodeURIComponent(activeSchema.SchemaName)}/${
                                activeSchema.Version
                            }/edit`}
                            state={{ from: location }}
                        >
                            Edit
                        </ButtonWithIcon>
                    )}
                    {isOwner && isDraft && (
                        <Button
                            color="info"
                            variant="contained"
                            onClick={() => {
                                setDialogOpen(true);
                            }}
                        >
                            Publish
                        </Button>
                    )}
                </Stack>
                <Divider sx={{ background: theme.palette.grey[200] }} />
                <SyntaxHighlighter language="json" showLineNumbers style={nord}>
                    {schema.Content ?? '{}'}
                </SyntaxHighlighter>
            </Box>
        </Stack>
    );
};
