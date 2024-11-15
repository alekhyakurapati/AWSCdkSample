import { authAtom } from '@eai-event-integration-platform/auth-ui';
import { useFetchSubscriptions } from '@eai-event-integration-platform/integration-hub/data';
import { ButtonWithIcon, SearchBar } from '@eai-event-integration-platform/integration-hub/shared-ui';
import { BrokerTypes, SubscriptionState } from '@eai-event-integration-platform/interfaces';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import { Box, Stack, Typography } from '@mui/material';
import { useAtom, useAtomValue } from 'jotai';
import { useMemo } from 'react';
import { subsEnvFilterAtom, subsSearchQueryAtom, subsSourceAppFilterAtom, subsSourceStatusFilterAtom } from '../atoms';
import { FilterOption } from '../types';
import { SubscriptionFilter } from './subscription-filter';

export const SubscriptionControls = () => {
    const [searchQuery, setSubsSearchQueryAtom] = useAtom(subsSearchQueryAtom);
    const auth = useAtomValue(authAtom);
    const { data: subscriptions, isLoading: loadingSubscriptions } = useFetchSubscriptions({
        userOwned: !auth.isAdmin,
    });
    const [sourceAppFilter, setSubsSourceAppFilter] = useAtom(subsSourceAppFilterAtom);
    const [subsEnvFilter, setSubsEnvFilter] = useAtom(subsEnvFilterAtom);
    const [sourceStatusFilter, setSubsSourceStatusFilter] = useAtom(subsSourceStatusFilterAtom);

    const isNoFilters = !sourceAppFilter && !subsEnvFilter && !sourceStatusFilter && !searchQuery;

    const filters = useMemo(() => {
        return [
            {
                title: 'Subscriber Application',
                options: [...new Set(subscriptions?.map((sub) => sub.AppName))],
                atom: subsSourceAppFilterAtom,
            },
            {
                title: 'Subscription Type',
                options: Object.values(BrokerTypes),
                atom: subsEnvFilterAtom,
            },
            {
                title: 'Subscription Status',
                options: Object.values(SubscriptionState),
                atom: subsSourceStatusFilterAtom,
            },
        ] as FilterOption[];
    }, [subscriptions]);

    if (loadingSubscriptions) {
        return null;
    }

    return (
        <Stack direction="row" display="flex">
            <SearchBar
                placeholder="Search Subscription"
                onChange={(event) => setSubsSearchQueryAtom(event.target.value)}
                value={searchQuery || ''}
                onClear={() => setSubsSearchQueryAtom('')}
            />
            <Stack direction="row" alignItems="center">
                {filters.map((filter) => (
                    <SubscriptionFilter filter={filter} key={filter.title} />
                ))}
                <Box sx={{ marginLeft: 2 }}>
                    <ButtonWithIcon
                        variant="contained"
                        disabled={isNoFilters}
                        onClick={() => {
                            setSubsSourceAppFilter(undefined);
                            setSubsEnvFilter(undefined);
                            setSubsSourceStatusFilter(undefined);
                            setSubsSearchQueryAtom('');
                        }}
                        endIcon={<FilterAltOffIcon />}
                    >
                        <Typography variant="body1" noWrap>
                            Clear All
                        </Typography>
                    </ButtonWithIcon>
                </Box>
            </Stack>
        </Stack>
    );
};
