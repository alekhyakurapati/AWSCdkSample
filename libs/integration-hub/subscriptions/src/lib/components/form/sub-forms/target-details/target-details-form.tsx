import { Box, Radio, Stack, Typography, FormControlLabel, RadioGroup } from '@mui/material';
import { BrokerTypes } from '@eai-event-integration-platform/interfaces';
import { Controller, useFormContext } from 'react-hook-form';
import { EventBusTarget } from './event-bridge';
import { RestAPITarget } from './rest-api';

interface TargetDetailsProps {
    prodType: BrokerTypes;
}

export const TargetDetailsForm = ({ prodType }: TargetDetailsProps) => {
    const { control, watch } = useFormContext();
    const watchTargetType = watch('TargetType');

    return (
        <Stack spacing={2}>
            <Typography variant="h3">Target Details</Typography>
            <Controller
                // MUI Radiogroup needs a react-hook-form controller to work
                control={control}
                name="TargetType"
                render={({ field }) => (
                    <Stack direction="row">
                        <RadioGroup row {...field}>
                            <FormControlLabel value="EventBus" control={<Radio />} label="Event Bus ARN" />
                            <FormControlLabel value="RestAPI" control={<Radio />} label="REST API" />
                        </RadioGroup>
                    </Stack>
                )}
            />

            {watchTargetType === 'EventBus' ? (
                <EventBusTarget prodType={prodType} />
            ) : (
                <RestAPITarget prodType={prodType} />
            )}
        </Stack>
    );
};
