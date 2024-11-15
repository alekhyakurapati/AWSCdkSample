import {
    useFetchAllApplications,
    useFetchDeliveryFailuresFilterOptions,
} from '@eai-event-integration-platform/integration-hub/data';
import { ButtonWithIcon, extractTargetArn } from '@eai-event-integration-platform/integration-hub/shared-ui';
import { BrokerTypes } from '@eai-event-integration-platform/interfaces';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import { Box, Stack, Typography } from '@mui/material';
import { DateTime } from 'luxon';
import { useAtom, useSetAtom } from 'jotai';
import _ from 'lodash';
import { useEffect, useMemo } from 'react';
import {
    eventEndTimestampAtom,
    eventSourceAppFilterAtom,
    eventStartTimestampAtom,
    eventSubsIdFilterAtom,
    eventTargetArnFilterAtom,
    eventUpdatedTimestampAtom,
} from '../atoms';
import { FilterOption } from '../types';
import { DatePicker } from './date-picker';
import { FilterContent } from './filter-content';

interface FilterControlInputProps {
    broker: BrokerTypes;
}

export const FilterControl = (propsInput: FilterControlInputProps) => {
    const { data: subscriberApplications } = useFetchAllApplications();
    const [eventSourceAppFilter, setEventSourceAppFilter] = useAtom(eventSourceAppFilterAtom);
    const setEventStartTimestamp = useSetAtom(eventStartTimestampAtom);
    const setEventEndTimestamp = useSetAtom(eventEndTimestampAtom);
    const [eventUpdatedTimestamp, setEventUpdatedTimestamp] = useAtom(eventUpdatedTimestampAtom);

    useEffect(() => {
        if (subscriberApplications && subscriberApplications[0]) {
            setEventSourceAppFilter(subscriberApplications[0].ShortName);
        }
    }, [setEventSourceAppFilter, subscriberApplications]);

    const { data: filterOptions } = useFetchDeliveryFailuresFilterOptions({
        broker: propsInput.broker,
        subscriberApplication: eventSourceAppFilter,
    });

    const [eventSubsIdFilter, setEventSubsIdFilter] = useAtom(eventSubsIdFilterAtom);
    const [eventTargetArnFilter, setTargetArnFilter] = useAtom(eventTargetArnFilterAtom);

    const isNoFilters = !eventSubsIdFilter && !eventTargetArnFilter && !eventUpdatedTimestamp;

    const filters = useMemo(() => {
        return [
            {
                title: 'Subscriber Application',
                options: [...new Set(subscriberApplications?.map((item) => item.ShortName))],
                value: `subscriber-app-${propsInput.broker}`,
                atom: eventSourceAppFilterAtom,
                removeClearFilterOption: true,
            },
            {
                title: 'Subscription ID',
                options: filterOptions ? filterOptions.SubscriptionIds.sort() : [],
                value: `subscriber-id-${propsInput.broker}`,
                atom: eventSubsIdFilterAtom,
            },
            {
                title: 'Target ARN',
                options: filterOptions
                    ? _.sortBy(filterOptions.TargetArns, [
                          function (arn) {
                              return extractTargetArn(arn);
                          },
                      ])
                    : [],
                value: `target-arn-${propsInput.broker}`,
                atom: eventTargetArnFilterAtom,
            },
        ] as FilterOption[];
    }, [filterOptions, subscriberApplications, propsInput.broker]);

    return (
        <Stack direction="row" display="flex">
            <Stack direction="row" alignItems="center">
                <Typography variant="h6" color="primary" sx={{ marginLeft: 2 }}>
                    FILTER
                </Typography>
                {filters.map((filter) => (
                    <FilterContent filter={filter} key={filter.title + propsInput.broker} />
                ))}
                <Stack direction="row" alignItems="center" spacing={2} sx={{ paddingLeft: 2 }}>
                    <DatePicker />
                </Stack>
                <Box sx={{ marginLeft: 2 }}>
                    <ButtonWithIcon
                        variant="contained"
                        disabled={isNoFilters}
                        onClick={() => {
                            setEventSubsIdFilter(undefined);
                            setTargetArnFilter(undefined);
                            setEventStartTimestamp(DateTime.utc().minus({ days: 60 }));
                            setEventEndTimestamp(DateTime.utc());
                            setEventUpdatedTimestamp(false);
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
