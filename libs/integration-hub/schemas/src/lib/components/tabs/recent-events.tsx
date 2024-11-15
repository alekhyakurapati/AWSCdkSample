import { TabHeader } from '@eai-event-integration-platform/integration-hub/shared-ui';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    Skeleton,
    Stack,
    Typography,
    useTheme,
} from '@mui/material';
import { useAtomValue } from 'jotai';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { nord } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { activeSchemaAtom } from '../../atoms';
import { useFetchRecentEvents } from '@eai-event-integration-platform/integration-hub/data';
import { BrokerTypes } from '@eai-event-integration-platform/interfaces';

export const RecentEventsTab = (props: { broker: BrokerTypes }) => {
    const { palette } = useTheme();
    const activeSchema = useAtomValue(activeSchemaAtom);
    const { data: events, isError, isLoading } = useFetchRecentEvents(activeSchema);

    if (isLoading || !activeSchema) {
        return <Skeleton variant="rounded" height={800} />;
    }

    if (props.broker === 'NP') {
        return <Typography>Recent Events are not yet available for Non-prod</Typography>;
    } else if (isError || !events) {
        return <Typography>Encountered an error fetching recent events</Typography>;
    }

    const isEvents = events.length > 0;

    const copyCode = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <Stack spacing={3}>
            {isEvents ? (
                <Box>
                    {events.map((example) => {
                        const eventTime = new Date((example.time as string) ?? '').toLocaleString();
                        const exampleString = JSON.stringify(example, null, 4);

                        return (
                            <Accordion key={eventTime}>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Typography color={palette.grey[700]} fontWeight={500}>
                                        {eventTime}
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails sx={{ position: 'relative' }}>
                                    <Box sx={{ background: 'rgb(46, 52, 64)', borderRadius: 4, paddingY: 0.5 }}>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            color="info"
                                            onClick={() => copyCode(exampleString)}
                                            startIcon={<ContentCopyIcon />}
                                            sx={{ position: 'absolute', right: 28, top: 20 }}
                                        >
                                            <Typography>Copy</Typography>
                                        </Button>
                                        <SyntaxHighlighter language="json" showLineNumbers style={nord}>
                                            {exampleString}
                                        </SyntaxHighlighter>
                                    </Box>
                                </AccordionDetails>
                            </Accordion>
                        );
                    })}
                </Box>
            ) : (
                <Typography>No events found within the last week.</Typography>
            )}
        </Stack>
    );
};
