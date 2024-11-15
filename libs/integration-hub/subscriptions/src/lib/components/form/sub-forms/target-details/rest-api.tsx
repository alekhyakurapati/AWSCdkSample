import { useFetchDestinations } from '@eai-event-integration-platform/integration-hub/data';
import { FORM_INPUT_WIDTH } from '@eai-event-integration-platform/integration-hub/shared-ui';
import { BrokerTypes } from '@eai-event-integration-platform/interfaces';
import { ErrorMessage } from '@hookform/error-message';
import AddCircleOutline from '@mui/icons-material/AddCircleOutline';
import { Button, FormHelperText, MenuItem, Select, Stack, Typography, useTheme, Alert } from '@mui/material';
import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { subscribingAppAtom, subscribingEnvAtom } from '../../../../atoms';
import { createRestTargetDialogAtom, selectedDestAtom } from '@eai-event-integration-platform/integration-hub/data';
import { SubscriptionForm } from '../../subscription-schema';

interface RestAPITargetProps {
    prodType: BrokerTypes;
}

export const RestAPITarget = ({ prodType }: RestAPITargetProps) => {
    const { data: restAPIs } = useFetchDestinations({ userOwned: true });
    const { palette } = useTheme();

    const setSubscribingApp = useSetAtom(subscribingAppAtom);
    const setSubscribingEnv = useSetAtom(subscribingEnvAtom);

    const selectedDest = useAtomValue(selectedDestAtom);

    useEffect(() => {
        setSubscribingEnv(prodType);
    }, [setSubscribingEnv, prodType]);

    const {
        control,
        formState: { errors },
        setValue,
        watch,
    } = useFormContext<SubscriptionForm>();
    const setCreateRestTargetDialogOpen = useSetAtom(createRestTargetDialogAtom);

    const watchApplication = watch('Application.ShortName');
    const isNoAppSelected = watchApplication === '';

    useEffect(() => {
        if (selectedDest) {
            setValue('Targets', [{ value: selectedDest }], { shouldDirty: true });
        }
    }, [setValue, selectedDest]);

    // Reset field value when a new application is selected
    useEffect(() => {
        setValue('Targets', [{ value: '' }]);
        setSubscribingApp(watchApplication);
    }, [setValue, watchApplication, setSubscribingApp]);

    const watchTargets = watch('Targets');

    // Reset field if the previoues value was an EventBus target
    useEffect(() => {
        if (watchTargets && watchTargets[0]?.value.includes('event-bus')) {
            setValue('Targets', [{ value: '' }]);
        }
    }, [setValue, watchTargets]);

    const prodTypeFormatted = prodType === 'PRD' ? 'Production' : 'Non-Production';

    if (isNoAppSelected)
        return (
            <Typography variant="body1" color={palette.error.contrastText}>
                Please select an application first
            </Typography>
        );

    return (
        <Stack spacing={2}>
            <Alert sx={{ border: '1px solid#FFD094' }} severity="warning">
                EventBridge requests to an API destination endpoint must have a maximum client execution timeout of 5
                seconds. If the target endpoint takes longer than 5 seconds to respond, EventBridge times out the
                request. EventBridge retries timed out requests up to the maximums that are configured on your retry
                policy (currently 24 hours and 185 times). After the maximum number of retries, events are sent to your
                dead-letter-queue
            </Alert>
            <Typography variant="h5">{`${prodTypeFormatted} REST API`}</Typography>

            <Stack direction="row" spacing={2}>
                <Controller
                    name="Targets"
                    control={control}
                    shouldUnregister={true}
                    render={({ field, fieldState: { error } }) => (
                        <Select
                            variant="standard"
                            displayEmpty
                            error={!!error}
                            sx={{ width: FORM_INPUT_WIDTH }}
                            {...field}
                            onChange={(e) => field.onChange([{ value: e.target.value }])}
                            value={field.value[0].value}
                        >
                            <MenuItem disabled value="">
                                -- Select REST API --
                            </MenuItem>
                            {restAPIs
                                ?.filter((target) => target.AppName === watchApplication && target.Broker === prodType)
                                .map((target) => (
                                    <MenuItem key={target.DestinationArn} value={target.DestinationArn}>
                                        {target.DestinationName}
                                    </MenuItem>
                                ))}
                        </Select>
                    )}
                />
                <Button
                    variant="outlined"
                    onClick={() => setCreateRestTargetDialogOpen(true)}
                    startIcon={<AddCircleOutline />}
                >
                    <Typography variant="body1">Create new REST API</Typography>
                </Button>
            </Stack>
            <ErrorMessage
                errors={errors}
                name="RestAPITarget"
                render={() => <FormHelperText error>Must select a REST API</FormHelperText>}
            />
        </Stack>
    );
};
