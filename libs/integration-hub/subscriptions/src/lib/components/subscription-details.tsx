import { authAtom } from '@eai-event-integration-platform/auth-ui';
import { useUpdateSubscription } from '@eai-event-integration-platform/integration-hub/data';
import { ButtonWithIcon } from '@eai-event-integration-platform/integration-hub/shared-ui';
import { BrokerTypes, Subscription, SubscriptionState } from '@eai-event-integration-platform/interfaces';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Chip, Divider, Stack, Switch, Tooltip, Typography, useTheme } from '@mui/material';
import { useIsFetching } from '@tanstack/react-query';
import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { activeSubscriptionAtom, deleteConfirmationDialogAtom, disableConfirmationDialogAtom } from '../atoms';

interface SubscriptionDetailsProps {
    subscription: Subscription;
    index: number;
}

export const SubscriptionDetails = ({ subscription, index }: SubscriptionDetailsProps) => {
    const theme = useTheme();
    const { mutate: updateSubscription, isLoading } = useUpdateSubscription();
    const isFetchingSubscriptions = useIsFetching(['subscriptions']);
    const [isDisabled, setIsDisabled] = useState(false);
    const { palette } = useTheme();
    const { isAdmin } = useAtomValue(authAtom);

    const setActiveSubscription = useSetAtom(activeSubscriptionAtom);
    const setDeleteDialogOpen = useSetAtom(deleteConfirmationDialogAtom);
    const setDisableDialogOpen = useSetAtom(disableConfirmationDialogAtom);

    // Wait for the mutation to complete and the subscriptions to refetch
    useEffect(() => {
        if (isLoading) setIsDisabled(true);
        else if (isDisabled && isFetchingSubscriptions === 0) setIsDisabled(false);
    }, [isDisabled, isFetchingSubscriptions, isLoading]);

    const isEnabled = subscription.State === SubscriptionState.ENABLED;
    const isProd = subscription.Broker === BrokerTypes.PRD;

    const toggleSubState = (_: unknown, enabled: boolean) => {
        if (isProd && !enabled) {
            setActiveSubscription(subscription);
            setDisableDialogOpen(true);
        } else {
            updateSubscription({
                ...subscription,
                State: enabled ? SubscriptionState.ENABLED : SubscriptionState.DISABLED,
            } as Subscription & { Name: string });
        }
    };

    const lastUpdated =
        subscription.LastUpdated &&
        new Date(subscription.LastUpdated).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });

    const handleDelete = () => {
        setActiveSubscription(subscription);
        setDeleteDialogOpen(true);
    };

    return (
        <>
            {index > 0 && <Divider />}
            <Stack spacing={2} padding={2}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <Typography variant="subtitle1" fontWeight={600}>
                            {`Subscription ID: ${subscription.Name}`}
                        </Typography>
                        <Chip
                            size="small"
                            label={isProd ? 'Production' : 'Non Production'}
                            color={isProd ? 'warning' : undefined}
                        />
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <span>
                            <Typography sx={{ fontWeight: '400 ' }} variant="button">
                                Disable
                            </Typography>
                            <Switch
                                sx={{
                                    '.MuiSwitch-track': {
                                        backgroundColor: theme.palette.grey[600],
                                    },
                                    '.MuiSwitch-switchBase': {
                                        color: theme.palette.grey[600],
                                        '&.Mui-checked': {
                                            color: theme.palette.grey[600],
                                        },
                                    },
                                    '.MuiSwitch-colorPrimary': {
                                        '&.Mui-checked': {
                                            color: '#4CAF50',
                                        },
                                        '&.Mui-checked + .MuiSwitch-track': {
                                            backgroundColor: '#4CAF50',
                                        },
                                    },
                                }}
                                onChange={toggleSubState}
                                color={'primary'}
                                checked={subscription.State === SubscriptionState.ENABLED}
                                disabled={isDisabled}
                            />
                            <Typography sx={{ fontWeight: '400 ' }} variant="button">
                                Enable
                            </Typography>
                        </span>
                        <ButtonWithIcon
                            size="small"
                            variant="outlined"
                            startIcon={<EditIcon fontSize="small" />}
                            LinkComponent={Link}
                            to={`/events/subscriptions/${encodeURIComponent(subscription.Name ?? '')}/edit`}
                            state={{
                                activeSchema: {
                                    SchemaName: subscription.SchemaName,
                                    Version: subscription.SchemaVersion,
                                },
                                prodType: isProd ? BrokerTypes.PRD : BrokerTypes.NP,
                            }}
                        >
                            Edit
                        </ButtonWithIcon>
                        <Tooltip title="Only administrators can delete subscriptions, please create a ticket in ServiceNow for 'Dig-Integration Support' if you would like to have this subscription removed.">
                            <span>
                                <ButtonWithIcon
                                    size="small"
                                    variant="outlined"
                                    disabled={isEnabled || !isAdmin}
                                    startIcon={<DeleteIcon fontSize="small" />}
                                    onClick={handleDelete}
                                    sx={{ justifySelf: 'flex-end' }}
                                >
                                    Delete
                                </ButtonWithIcon>
                            </span>
                        </Tooltip>
                    </Stack>
                </Stack>
                <Stack spacing={0.5}>
                    <Typography variant="body2" textTransform="uppercase" color={palette.grey[600]}>
                        Target ARN{subscription.Targets && subscription.Targets.length > 1 ? 's' : ''}
                    </Typography>
                    {subscription.Targets &&
                        subscription.Targets.map((target) => (
                            <Typography key={target} color={palette.grey[800]} variant="body1">
                                {target}
                            </Typography>
                        ))}
                </Stack>
                <Stack direction="row" spacing={4} alignItems="center">
                    <Stack spacing={0.5}>
                        <Typography variant="body2" textTransform="uppercase" color={palette.grey[600]}>
                            Description
                        </Typography>
                        <Typography color={palette.grey[800]} variant="body1">
                            {subscription.Description}
                        </Typography>
                    </Stack>
                    <Stack spacing={0.5}>
                        <Typography variant="body2" textTransform="uppercase" color={palette.grey[600]}>
                            Schema Version
                        </Typography>
                        <Typography color={palette.grey[800]} variant="body1">
                            {subscription.SchemaVersion}
                        </Typography>
                    </Stack>
                    <Stack spacing={0.5}>
                        <Typography variant="body2" textTransform="uppercase" color={palette.grey[600]}>
                            Subscribing Domain
                        </Typography>
                        <Typography color={palette.grey[800]} variant="body1">
                            {subscription.SubscribingDomain}
                        </Typography>
                    </Stack>
                    <Stack spacing={0.5}>
                        <Typography variant="body2" textTransform="uppercase" color={palette.grey[600]}>
                            Created By
                        </Typography>
                        <Typography color={palette.grey[800]} variant="body1">
                            {subscription.CreatedBy}
                        </Typography>
                    </Stack>
                    <Stack spacing={0.5}>
                        <Typography variant="body2" textTransform="uppercase" color={palette.grey[600]}>
                            Last Updated By
                        </Typography>
                        <Typography color={palette.grey[800]} variant="body1">
                            {subscription.CreatedBy}
                        </Typography>
                    </Stack>
                    <Stack spacing={0.5}>
                        <Typography variant="body2" textTransform="uppercase" color={palette.grey[600]}>
                            Last Updated
                        </Typography>
                        <Typography color={palette.grey[800]} variant="body1">
                            {lastUpdated}
                        </Typography>
                    </Stack>
                </Stack>
            </Stack>
        </>
    );
};
