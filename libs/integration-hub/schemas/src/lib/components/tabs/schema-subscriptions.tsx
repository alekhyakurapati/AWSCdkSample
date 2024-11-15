import { useFetchSchemaDetails } from '@eai-event-integration-platform/integration-hub/data';
import { BrokerTypes } from '@eai-event-integration-platform/interfaces';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary, Box, Stack, Typography } from '@mui/material';
import { useAtomValue } from 'jotai';
import lodash from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { activeSchemaAtom } from '../../atoms';
import { SubscriptionTabContentView } from './subscriptions-tab-content';

export const SchemaSubscriptionsTab = (props: { broker: BrokerTypes }) => {
    const activeSchema = useAtomValue(activeSchemaAtom);
    const { data: schema } = useFetchSchemaDetails(activeSchema);

    const availableEnvironments = useMemo(
        () =>
            lodash
                .compact([...new Set(schema?.Subscriptions?.map((subscription) => subscription.Broker))])
                .sort()
                .reverse(),
        [schema],
    );

    if (!schema || !schema?.Subscriptions || !availableEnvironments.includes(props.broker)) {
        return (
            <Stack spacing={3}>
                <Stack alignItems="center">
                    <Typography variant="subtitle1">
                        No {props.broker === 'PRD' ? 'Production' : 'Non-Production'} subscriptions for this event.
                    </Typography>
                </Stack>
            </Stack>
        );
    }

    return (
        <Stack spacing={3}>
            <Typography variant="body2">Existing subscription for this event in Woodside</Typography>
            {schema?.Subscriptions.filter((subscription) => subscription.Broker === props.broker).map(
                (subscription) => (
                    <Accordion TransitionProps={{ mountOnEnter: true }} key={subscription.Name}>
                        <Box>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Stack>
                                    <Typography variant="subtitle1" fontWeight="bold">
                                        {subscription.Name}
                                    </Typography>
                                    <Typography variant="subtitle1">{subscription.Description}</Typography>
                                </Stack>
                            </AccordionSummary>
                        </Box>
                        <AccordionDetails>
                            <SubscriptionTabContentView subscription={subscription} />
                        </AccordionDetails>
                    </Accordion>
                ),
            )}
        </Stack>
    );
};
