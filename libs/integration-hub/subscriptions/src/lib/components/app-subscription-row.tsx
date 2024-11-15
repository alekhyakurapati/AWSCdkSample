import { SubscriptionsBySchemaName } from '../types';
import { Box, Typography } from '@mui/material';
import { SchemaSubscriptionRow } from './schema-subscription-row';
import * as lodash from 'lodash';

export interface AppSubscriptionRowProps {
    schemas: SubscriptionsBySchemaName[];
    appName: string;
}

export const AppSubscriptionRow = ({ schemas, appName }: AppSubscriptionRowProps) => {
    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 2.5, marginTop: 2.5 }}>
                <Typography variant="h6" sx={{ fontWeight: '700' }}>
                    {appName} Subscriptions
                </Typography>
            </Box>

            {lodash.orderBy(schemas, ['SchemaName'], ['asc']).map((schema) => {
                return <SchemaSubscriptionRow key={schema.SchemaName} schema={schema} />;
            })}
        </Box>
    );
};
