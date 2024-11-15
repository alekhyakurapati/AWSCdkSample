import { useState } from 'react';
import { SubscriptionsBySchemaName } from '../types';
import { Accordion, AccordionDetails, AccordionSummary, Stack, Typography, Chip, useTheme } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { SubscriptionDetails } from './subscription-details';

interface SchemaSubscriptionRowProps {
    schema: SubscriptionsBySchemaName;
}

export const SchemaSubscriptionRow = ({ schema }: SchemaSubscriptionRowProps) => {
    const [expanded, setExpanded] = useState<boolean>(false);
    const onExpand = () => {
        setExpanded(!expanded);
    };
    const theme = useTheme();
    return (
        <Accordion expanded={expanded} sx={{ mb: 1.25 }}>
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ backgroundColor: expanded ? theme.palette.grey[100] : theme.palette.common.white }}
                onClick={() => onExpand()}
            >
                <Stack direction="column" sx={{ paddingX: 1.25 }}>
                    <Stack direction="row" alignItems="center">
                        <Typography
                            sx={{
                                fontWeight: '600',
                                alignItems: 'center',
                                display: 'flex',
                                paddingRight: 2.5,
                            }}
                            variant="subtitle1"
                        >
                            {schema.SchemaName}
                        </Typography>
                        <Chip
                            sx={{ fontWeight: '700', height: 20 }}
                            color={schema.SchemaAppName === 'InvalidSchema' ? 'warning' : 'info'}
                            label={schema.SchemaAppName}
                        />
                    </Stack>
                    <Typography align="left">{schema.SchemaDescription}</Typography>
                </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
                {schema.Subscriptions.map((subscription, index) => {
                    return <SubscriptionDetails key={subscription.Name} subscription={subscription} index={index} />;
                })}
            </AccordionDetails>
        </Accordion>
    );
};
