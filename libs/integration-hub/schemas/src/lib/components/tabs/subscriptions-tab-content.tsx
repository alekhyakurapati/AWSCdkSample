import { Subscription } from '@eai-event-integration-platform/interfaces';
import { Box, Stack, Typography } from '@mui/material';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { nord } from 'react-syntax-highlighter/dist/esm/styles/hljs';

interface SubscriptionTabContentViewPRops {
    subscription: Subscription;
}

const formatJSON = (input: string | undefined) => {
    try {
        return input ? JSON.stringify(JSON.parse(input), null, 4) : '';
    } catch (err) {
        return '';
    }
};

export const SubscriptionTabContentView = ({ subscription }: SubscriptionTabContentViewPRops) => {
    if (!subscription) return null;

    const rulePatternFormatted = formatJSON(subscription.RulePattern);

    return (
        <Stack spacing={2}>
            <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', textAlign: 'left' }}>
                    Targets
                </Typography>
                {subscription.Targets &&
                    subscription?.Targets.map((target, index) => (
                        <Typography variant="subtitle1" key={index}>
                            {target}
                        </Typography>
                    ))}
            </Box>
            <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                    Subscription Owner
                </Typography>
                <Typography variant="subtitle1">{subscription.SubscriptionOwner}</Typography>
                <Typography variant="subtitle1">Application : {subscription.AppName}</Typography>
                <Typography variant="subtitle1">CI Number : {subscription.AppCINumber}</Typography>
                <Typography variant="subtitle1">CostCode : {subscription.CostCode}</Typography>
            </Box>
            <Box sx={{ background: 'rgb(46, 52, 64)', borderRadius: 4, padding: 0.1 }}>
                <SyntaxHighlighter language="json" showLineNumbers style={nord}>
                    {rulePatternFormatted}
                </SyntaxHighlighter>
            </Box>
        </Stack>
    );
};
