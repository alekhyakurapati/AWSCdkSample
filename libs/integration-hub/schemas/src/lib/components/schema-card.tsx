import { extractSchemaShortName } from '@eai-event-integration-platform/integration-hub/shared-ui';
import { SchemaSummary, SchemaVersionState } from '@eai-event-integration-platform/interfaces';
import { Card, Chip, Divider, Stack, Typography, useTheme } from '@mui/material';
import CardContent from '@mui/material/CardContent';
import { useAtomValue } from 'jotai';
import { Link } from 'react-router-dom';
import { activeSchemaAtom } from '../atoms';

export interface SchemaCardInputProps {
    schema: SchemaSummary;
}

export const SchemaCard = (props: SchemaCardInputProps) => {
    const { palette } = useTheme();
    const activeSchema = useAtomValue(activeSchemaAtom);
    const isActiveSchema = activeSchema?.SchemaName === props.schema.SchemaName;

    const eventName = props.schema.SchemaName ? extractSchemaShortName(props.schema.SchemaName) : '';

    const lastUpdatedTimeText = `Last Updated ${new Date(props.schema?.LastUpdated as string).toLocaleDateString(
        'en-GB',
        {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        },
    )}`;

    const versionText =
        props.schema.VersionCount && props.schema.VersionCount < 2
            ? `${props.schema.VersionCount} Version`
            : `${props.schema.VersionCount} Versions`;

    const isPublished = props.schema.AvailableVersions
        ? Object.values(props.schema.AvailableVersions).includes(SchemaVersionState.PUBL)
        : 'false';

    return (
        <Card
            sx={{ textDecoration: 'none' }}
            component={Link}
            to={`/events/schemas/${encodeURIComponent(props.schema.SchemaName ?? '')}/${encodeURIComponent(
                props.schema.VersionCount ?? 1,
            )}`}
        >
            <CardContent
                sx={{
                    border: 2,
                    borderColor: isActiveSchema ? palette.secondary.main : palette.common.white,
                }}
            >
                <Stack spacing={1}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="caption" color={palette.grey[600]} flexGrow={1} noWrap>
                            {props.schema.SchemaName}
                        </Typography>
                        <Chip color="info" size="small" label={props.schema?.AppName} />
                    </Stack>

                    <Typography variant="h6" color="primary" noWrap>
                        {eventName}
                    </Typography>

                    <Typography variant="body2" color={palette.grey[600]} sx={{ wordBreak: 'break-word' }}>
                        {props.schema.Description}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        <Typography variant="caption" color={palette.grey[600]}>
                            {versionText}
                        </Typography>
                        <Divider orientation="vertical" flexItem />
                        <Typography variant="caption" color={palette.grey[600]}>
                            {lastUpdatedTimeText}
                        </Typography>
                        {!isPublished && <Chip size="small" label="Non-Production" />}
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );
};
