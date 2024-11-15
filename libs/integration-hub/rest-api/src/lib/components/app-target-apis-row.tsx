import { Box, Stack, Typography } from '@mui/material';
import { TargetApiCard } from './target-api-card';
import { Destination, Subscription } from '@eai-event-integration-platform/interfaces';
import * as lodash from 'lodash';

export interface AppTargetApisRowProps {
    restApis: Destination[];
    appName: string;
    subscriptions: Subscription[];
}

export const AppTargetApisRow = ({ restApis, appName, subscriptions }: AppTargetApisRowProps) => {
    return (
        <Box sx={{ marginTop: 5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 2.5, marginTop: 1.5 }}>
                <Typography sx={{ fontWeight: '700' }} variant="h6">
                    {appName} Target APIs
                </Typography>
            </Box>
            {restApis.length === 0 && (
                <Typography variant="subtitle1" textAlign="left">
                    No target apis setup
                </Typography>
            )}
            <Stack spacing={4}>
                {lodash.sortBy(restApis, ['Broker', 'DestinationName']).map((restApi, index) => {
                    return <TargetApiCard key={index} destination={restApi} subscriptions={subscriptions} />;
                })}
            </Stack>
        </Box>
    );
};
