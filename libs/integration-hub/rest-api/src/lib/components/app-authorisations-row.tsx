import { Box, Stack, Typography } from '@mui/material';
import { AuthorisationCard } from './authorisation-card';
import { Connection, Destination } from '@eai-event-integration-platform/interfaces';
import * as lodash from 'lodash';

export interface AppAuthorisationsRowProps {
    authorisations: Connection[];
    appName: string;
    destinations: { [key: string]: Destination[] };
}

export const AppAuthorisationsRow = ({ authorisations, appName, destinations }: AppAuthorisationsRowProps) => {
    return (
        <Box sx={{ marginTop: 5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 2.5, marginTop: 1.5 }}>
                <Typography sx={{ fontWeight: '700' }} variant="h6">
                    {appName} Authorisations
                </Typography>
            </Box>

            {authorisations.length === 0 && (
                <Typography variant="subtitle1" textAlign="left">
                    No authorisations setup
                </Typography>
            )}

            <Stack spacing={2}>
                {lodash.sortBy(authorisations, ['Broker', 'ConnectionName']).map((authorisation, index) => {
                    return (
                        <AuthorisationCard
                            key={index}
                            connection={authorisation}
                            destinations={
                                authorisation.ConnectionName ? destinations[authorisation.ConnectionName] : undefined
                            }
                        />
                    );
                })}
            </Stack>
        </Box>
    );
};
