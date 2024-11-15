import { convertTimeStamp, formatJSON } from '@eai-event-integration-platform/integration-hub/shared-ui';
import { Box, Button, Typography } from '@mui/material';
import { useAtom, useSetAtom } from 'jotai';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { nord } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { currentFailureMessageAtom, viewPayloadDialogOpenAtom } from '../atoms';

export const PayloadDetail = () => {
    const [currentFailureMessage, setCurrentFailureMessage] = useAtom(currentFailureMessageAtom);
    const setViewPayloadDialogOpen = useSetAtom(viewPayloadDialogOpenAtom);

    return (
        <Box sx={{ margin: 6 }}>
            {currentFailureMessage && (
                <Box>
                    <Box justifyContent="center" display="flex">
                        <Typography variant="h5" fontWeight="700">
                            Failed Event Details
                        </Typography>
                    </Box>
                    <Box marginBottom="30px">
                        <Typography variant="subtitle1">Subscription ID</Typography>
                        <Typography variant="subtitle1" fontWeight="700">
                            {currentFailureMessage.SubscriptionId}
                        </Typography>
                    </Box>
                    <Box marginBottom="30px">
                        <Typography variant="subtitle1">Target ARN</Typography>
                        <Typography variant="subtitle1" fontWeight="700">
                            {currentFailureMessage.TargetArn}
                        </Typography>
                    </Box>
                    <Box marginBottom="30px">
                        <Typography variant="subtitle1">Failed Event ID</Typography>
                        <Typography variant="subtitle1" fontWeight="700">
                            {currentFailureMessage.EventId}
                        </Typography>
                    </Box>
                    <Box marginBottom="30px">
                        <Typography variant="subtitle1">Failure Time</Typography>
                        <Typography variant="subtitle1" fontWeight="700">
                            {convertTimeStamp(currentFailureMessage.SentTimestamp)}
                        </Typography>
                    </Box>
                    <Box marginBottom="30px">
                        <Typography variant="subtitle1">Error Reason</Typography>
                        <Typography variant="subtitle1" fontWeight="700">
                            {currentFailureMessage.ErrorCode}
                        </Typography>
                    </Box>
                    <Box marginBottom="30px">
                        <Typography variant="subtitle1">Error Message</Typography>
                        <Typography variant="subtitle1" fontWeight="700">
                            {currentFailureMessage.ErrorMessage}
                        </Typography>
                    </Box>
                    <SyntaxHighlighter
                        language="json"
                        text={formatJSON(currentFailureMessage?.Body)}
                        showLineNumbers
                        style={nord}
                    >
                        {formatJSON(currentFailureMessage?.Body)}
                    </SyntaxHighlighter>
                    <Box justifyContent="flex-end" display="flex" marginTop="30px">
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => {
                                setCurrentFailureMessage(undefined);
                                setViewPayloadDialogOpen(false);
                            }}
                        >
                            <Typography variant="subtitle1">Close</Typography>
                        </Button>
                    </Box>
                </Box>
            )}
        </Box>
    );
};
