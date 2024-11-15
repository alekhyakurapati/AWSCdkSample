import { authAtom } from '@eai-event-integration-platform/auth-ui';
import { useFetchAllSchemas, useFetchSubscriptions } from '@eai-event-integration-platform/integration-hub/data';
import { BrokerTypes, Subscription, SubscriptionState } from '@eai-event-integration-platform/interfaces';
import { Skeleton, Stack } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useMemo } from 'react';
import { subsEnvFilterAtom, subsSearchQueryAtom, subsSourceAppFilterAtom, subsSourceStatusFilterAtom } from '../atoms';
import { SubscriptionsBySchemaName } from '../types';
import { AppSubscriptionRow } from './app-subscription-row';

export const SubscriptionList = () => {
    const auth = useAtomValue(authAtom);
    const subsSearchQuery = useAtomValue(subsSearchQueryAtom);
    const subsSourceAppFilter = useAtomValue(subsSourceAppFilterAtom);
    const subsEnvFilter = useAtomValue(subsEnvFilterAtom);
    const subsSourceStatusFilter = useAtomValue(subsSourceStatusFilterAtom);

    const { data: subscriptions, isLoading: loadingSubscriptions } = useFetchSubscriptions({
        userOwned: !auth.isAdmin,
    });
    const { data: schemas, isLoading: loadingSchemas } = useFetchAllSchemas();

    const trimName = (name: string | undefined): string => {
        if (!name) return '';
        const leftParen = name.indexOf('(');
        if (leftParen >= 0) return name.substring(0, leftParen);
        const leftArrow = name.indexOf('<');
        if (leftArrow >= 0) return name.substring(0, leftArrow);
        return name;
    };

    const subsTextFilter = (subs: Subscription, subsSearchQuery: string | undefined) => {
        if (subsSearchQuery) {
            return subs.Name?.toLowerCase().includes(subsSearchQuery.toLowerCase());
        }
        return true;
    };

    const subsDropdownFilter = (
        subs: Subscription,
        subsSourceAppFilter: string | undefined,
        subsEnvFilter: string | undefined,
        subsSourceStatusFilter: string | undefined,
    ) => {
        return (
            (!subsSourceAppFilter || !subs.AppName || subsSourceAppFilter === subs.AppName) &&
            (!subsEnvFilter || !subs.Broker || subsEnvFilter === BrokerTypes[subs.Broker]) &&
            (!subsSourceStatusFilter || !subs.State || subsSourceStatusFilter === SubscriptionState[subs.State])
        );
    };

    const filterSubscriptions = useMemo(() => {
        return (
            subscriptions
                ?.filter((subs) => subsTextFilter(subs, subsSearchQuery))
                .filter((subs) =>
                    subsDropdownFilter(subs, subsSourceAppFilter, subsEnvFilter, subsSourceStatusFilter),
                ) ?? []
        );
    }, [subsSearchQuery, subsSourceAppFilter, subsEnvFilter, subsSourceStatusFilter, subscriptions]);

    const subscriptionDetail = useMemo(() => {
        const groupedSubscriptions = {} as { [key: string]: SubscriptionsBySchemaName[] };
        if (subscriptions && schemas && filterSubscriptions) {
            filterSubscriptions.forEach((item) => {
                if (item.AppName) {
                    if (groupedSubscriptions[item.AppName] === undefined) {
                        groupedSubscriptions[item.AppName] = [];
                    }

                    const groupedSubs = groupedSubscriptions[item.AppName].filter(
                        (thisitem) => thisitem.SchemaName === item.SchemaName,
                    );
                    let groupedSub = null;

                    const schemaInfo = schemas?.find((schema) => schema.SchemaName === item.SchemaName) ?? {
                        AppName: 'InvalidSchema',
                        Description:
                            'This schema does not exist, please contact the support team for this application to maintain service for your subscription.',
                    };

                    if (groupedSubs.length === 0) {
                        groupedSub = {
                            SchemaName: item.SchemaName,
                            OwnerRole: item.SubscriptionOwner,
                            Description: item.Description,
                            Subscriptions: [],
                            AppName: item.SubscriptionOwner,
                            SchemaAppName: schemaInfo.AppName,
                            SchemaDescription: schemaInfo.Description,
                        } as SubscriptionsBySchemaName;
                        groupedSubscriptions[item.AppName].push(groupedSub);
                    } else {
                        groupedSub = groupedSubs[0];
                    }

                    groupedSub.Subscriptions.push({
                        ...item,
                        CreatedBy: trimName(item.CreatedBy),
                        LastUpdatedBy: trimName(item.LastUpdatedBy),
                    });
                }
            });
        }

        return groupedSubscriptions;
    }, [schemas, subscriptions, filterSubscriptions]);

    if (loadingSubscriptions || loadingSchemas) {
        return (
            <Stack marginTop={4} spacing={1}>
                {Array(8)
                    .fill(null)
                    .map((_, i) => (
                        <Skeleton key={i} height={100} />
                    ))}
            </Stack>
        );
    }

    return (
        <>
            {Object.entries(subscriptionDetail).map((appsubs) => {
                return <AppSubscriptionRow key={appsubs[0]} appName={appsubs[0]} schemas={appsubs[1]} />;
            })}
        </>
    );
};
