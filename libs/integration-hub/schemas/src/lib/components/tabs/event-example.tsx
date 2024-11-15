import { ButtonWithIcon, TabHeader } from '@eai-event-integration-platform/integration-hub/shared-ui';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Box, Divider, Skeleton, Stack, Typography, useTheme } from '@mui/material';
import { useAtomValue } from 'jotai';
import { enqueueSnackbar } from 'notistack';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { nord } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { activeSchemaAtom } from '../../atoms';
import { useFetchSchemaDetails } from '@eai-event-integration-platform/integration-hub/data';

export const EventExampleTab = () => {
    const theme = useTheme();
    const activeSchema = useAtomValue(activeSchemaAtom);
    const { data: schema, isError, isLoading } = useFetchSchemaDetails(activeSchema);

    if (isLoading || !activeSchema || !schema) {
        return <Skeleton variant="rounded" height={800} />;
    }

    if (isError || !schema) return null;

    const schemaContent = (() => {
        try {
            return JSON.parse(schema.Content ?? '');
        } catch (ex) {
            return {};
        }
    })();

    const examples: string[] =
        schemaContent?.examples?.map((example: Record<string, unknown>) => JSON.stringify(example, null, 4)) ?? [];

    const copyCode = (text: string) => {
        navigator.clipboard.writeText(text);
        enqueueSnackbar({ message: 'Copied to clipboard', variant: 'success' });
    };

    return (
        <Stack spacing={3}>
            <TabHeader>Event Examples</TabHeader>
            {examples.map((example, i) => (
                <Box
                    key={i} // Order should be stable, so this should be okay
                    sx={{
                        background: 'rgb(46, 52, 64)',
                        borderRadius: 4,
                        color: theme.palette.grey[200],
                    }}
                >
                    <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        spacing={2}
                        sx={{ marginX: 2, marginTop: 2, paddingBottom: 1.5 }}
                    >
                        <Typography variant="body2">
                            Copy this code into AWS Console to test that it's fit for purpose
                        </Typography>
                        <ButtonWithIcon
                            variant="contained"
                            size="small"
                            color="info"
                            onClick={() => copyCode(example)}
                            startIcon={<ContentCopyIcon />}
                        >
                            Copy
                        </ButtonWithIcon>
                    </Stack>
                    <Divider sx={{ background: theme.palette.grey[200] }} />
                    <SyntaxHighlighter language="json" showLineNumbers style={nord}>
                        {example}
                    </SyntaxHighlighter>
                </Box>
            ))}
        </Stack>
    );
};
