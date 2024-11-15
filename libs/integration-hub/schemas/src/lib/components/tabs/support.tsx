import { useFetchApplicationByName, useFetchSchemaDetails } from '@eai-event-integration-platform/integration-hub/data';
import { ButtonWithIcon, TabHeader } from '@eai-event-integration-platform/integration-hub/shared-ui';
import { Box, Chip, Skeleton, Stack, Typography, useTheme } from '@mui/material';
import { useAtomValue } from 'jotai';
import { activeSchemaAtom } from '../../atoms';

import OpenInNewIcon from '@mui/icons-material/OpenInNew';

export const SupportTab = () => {
    const activeSchema = useAtomValue(activeSchemaAtom);
    const { data: schema, isError, isLoading } = useFetchSchemaDetails(activeSchema);
    const { data: application } = useFetchApplicationByName(schema?.AppName);
    const theme = useTheme();
    const { palette } = theme;
    const lastUpdated = new Date(schema?.LastUpdated ?? '').toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });

    if (isLoading || !schema || !activeSchema) {
        return <Skeleton variant="rounded" height={800} />;
    }

    if (isError || !schema) return null;

    return (
        <Stack spacing={3}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <TabHeader>Support</TabHeader>

                <ButtonWithIcon
                    variant="outlined"
                    startIcon={<OpenInNewIcon />}
                    href="https://woodside.service-now.com/sp?id=sc_cat_item&sys_id=3f1dd0320a0a0b99000a53f7604a2ef9"
                    target="_blank"
                >
                    Raise Support Ticket
                </ButtonWithIcon>
            </Stack>

            <Stack direction="row" spacing={16}>
                <Box>
                    <Typography fontSize={12} color={palette.grey[600]}>
                        SUPPORT CONTACT
                    </Typography>
                    <Chip
                        label={schema.SchemaSupportGroup ?? 'N/A'}
                        component="a"
                        href={`mailto:${schema.SchemaSupportGroup ?? 'N/A'}`}
                        clickable
                    />
                </Box>
                <Box>
                    <Typography fontSize={12} color={palette.grey[600]}>
                        ASSIGNMENT GROUP
                    </Typography>
                    <Typography fontSize={14}>{application?.AssignmentGroup ?? 'N/A'}</Typography>
                </Box>
            </Stack>
            <Stack direction="row" spacing={16}>
                <Box>
                    <Typography fontSize={12} color={palette.grey[600]}>
                        LAST UPDATED
                    </Typography>
                    <Typography fontSize={14}>{lastUpdated}</Typography>
                </Box>

                <Box>
                    <Typography fontSize={12} color={palette.grey[600]}>
                        LAST UPDATED BY{' '}
                    </Typography>
                    <Typography fontSize={14}>
                        {schema?.LastUpdatedBy ? schema?.LastUpdatedBy.split(' <')[0] : 'N/A'}
                    </Typography>
                </Box>

                <Box>
                    <Typography fontSize={12} color={palette.grey[600]}>
                        CREATED BY
                    </Typography>
                    <Typography fontSize={14}>
                        {schema?.CreatedBy ? schema?.CreatedBy.split(' <')[0] : 'N/A'}
                    </Typography>
                </Box>
            </Stack>
        </Stack>
    );
};
