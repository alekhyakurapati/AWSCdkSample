import { useInfiniteQuery } from '@tanstack/react-query';
import { useAuthenticatedFetch } from '@eai-event-integration-platform/auth-ui';
import { BrokerTypes, PagedFailureMessage } from '@eai-event-integration-platform/interfaces';
import { DateTime } from 'luxon';

export const useFetchDeliveryFailures = (props: {
    broker: BrokerTypes;
    subscriberApplication: string | undefined;
    subscriptionId?: string | undefined;
    targetArn?: string | undefined;
    startEventTimestamp?: DateTime | null;
    endEventTimestamp?: DateTime | null;
}) => {
    const authenticatedFetch = useAuthenticatedFetch();

    return useInfiniteQuery<PagedFailureMessage>(
        [
            'paged-event-failures',
            props.subscriberApplication,
            props.broker,
            props.subscriptionId,
            props.targetArn,
            props.startEventTimestamp,
            props.endEventTimestamp,
        ],
        ({ pageParam }) => {
            const urlParams = new URLSearchParams();
            if (props.subscriberApplication) urlParams.set('subscriberApplication', props.subscriberApplication);

            if (props.broker) urlParams.set('broker', props.broker);

            if (props.subscriptionId) urlParams.set('subscriptionId', props.subscriptionId);

            if (props.targetArn) urlParams.set('targetArn', props.targetArn);

            urlParams.set(
                'startEventTimestamp',
                props.startEventTimestamp?.startOf('day').toISO() ??
                    (DateTime.utc().minus({ days: 60 }).startOf('day').toISO() || ''),
            );

            urlParams.set(
                'endEventTimestamp',
                props.endEventTimestamp?.endOf('day').toISO() ?? (DateTime.utc().endOf('day').toISO() || ''),
            );
            if (pageParam) urlParams.set('offset', JSON.stringify(pageParam));

            urlParams.set('limit', '10');
            const urlString = urlParams.toString();

            return authenticatedFetch(`/event-failures` + (urlString ? '?' + urlString : ''));
        },
        { getNextPageParam: (lastPage) => lastPage.Offset },
    );
};
