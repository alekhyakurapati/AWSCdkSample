import { ButtonWithIcon } from '@eai-event-integration-platform/integration-hub/shared-ui';
import {
    BrokerTypes,
    Destination,
    DestinationHttpMethods,
    Subscription,
    SubscriptionState,
} from '@eai-event-integration-platform/interfaces';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Card, CardContent, Chip, Stack, Typography, useTheme } from '@mui/material';
import { useSetAtom } from 'jotai';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { activeTargetApiAtom, deleteConfirmationTargetApiDialogAtom } from '../atoms';
import { HttpMethodColors } from '../types';
import { ActiveSubscriptionsDropdown } from './active-subscriptions-dropdwon';

export interface TargetApiCardProps {
    destination: Destination;
    subscriptions: Subscription[];
}

export const TargetApiCard = ({ destination, subscriptions }: TargetApiCardProps) => {
    const httpMethod: DestinationHttpMethods = destination.HttpMethod
        ? (destination.HttpMethod as DestinationHttpMethods)
        : DestinationHttpMethods.GET;
    const httpMethodColor: string = HttpMethodColors[httpMethod];

    const { palette } = useTheme();

    const setActiveTargetApi = useSetAtom(activeTargetApiAtom);
    const setDialogOpen = useSetAtom(deleteConfirmationTargetApiDialogAtom);

    const activeSubscriptions = useMemo(() => {
        return subscriptions
            ?.filter((subscription) => {
                return subscription.State === SubscriptionState.ENABLED;
            })
            .filter((subscription) => {
                return subscription.Targets?.includes(destination.DestinationArn ? destination.DestinationArn : '');
            });
    }, [subscriptions, destination.DestinationArn]);

    const isProd = destination.Broker === BrokerTypes.PRD;

    const handleDelete = () => {
        setActiveTargetApi(destination);
        setDialogOpen(true);
    };

    return (
        <Card>
            <CardContent>
                <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Typography sx={{ fontWeight: '600' }} variant="subtitle1">
                                {destination.DestinationName}
                            </Typography>
                            <Chip
                                size="small"
                                label={isProd ? 'Production' : 'Non Production'}
                                color={isProd ? 'warning' : undefined}
                            />
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <ButtonWithIcon
                                size="small"
                                variant="outlined"
                                startIcon={<EditIcon fontSize="small" />}
                                LinkComponent={Link}
                                to={`/events/targets/rest-api/${encodeURIComponent(
                                    destination.ConnectionName ?? '',
                                )}/${encodeURIComponent(destination.DestinationName ?? '')}/edit`}
                            >
                                Edit
                            </ButtonWithIcon>
                            <ButtonWithIcon
                                size="small"
                                variant="outlined"
                                disabled={activeSubscriptions && activeSubscriptions?.length > 0}
                                startIcon={<DeleteIcon fontSize="small" />}
                                onClick={handleDelete}
                                sx={{ justifySelf: 'flex-end' }}
                            >
                                Delete
                            </ButtonWithIcon>
                        </Stack>
                    </Stack>
                    <Stack spacing={0.5}>
                        <Typography variant="body2" textTransform="uppercase" color={palette.grey[600]}>
                            Description
                        </Typography>
                        <Typography color={palette.grey[800]} variant="body1">
                            {destination.Description}
                        </Typography>
                    </Stack>
                    <Stack direction="row" spacing={8}>
                        <Stack spacing={0.5}>
                            <Typography variant="body2" textTransform="uppercase" color={palette.grey[600]}>
                                Endpoint
                            </Typography>
                            <Stack direction="row" spacing={1}>
                                <Typography
                                    variant="subtitle1"
                                    color={httpMethodColor}
                                    sx={{
                                        fontWeight: '600',
                                    }}
                                >
                                    {destination.HttpMethod}
                                </Typography>
                                <Typography color={palette.grey[800]} variant="body1">
                                    {destination.InvocationEndpoint}
                                </Typography>
                            </Stack>
                        </Stack>
                        {activeSubscriptions && activeSubscriptions?.length > 0 && (
                            <ActiveSubscriptionsDropdown activeSubscriptions={activeSubscriptions} />
                        )}
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );
};
