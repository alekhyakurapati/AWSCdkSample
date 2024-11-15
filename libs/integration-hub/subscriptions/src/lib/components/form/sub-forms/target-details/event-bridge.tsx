import { Tooltip } from '@eai-event-integration-platform/integration-hub/shared-ui';
import { BrokerTypes } from '@eai-event-integration-platform/interfaces';
import { ErrorMessage } from '@hookform/error-message';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { Box, Button, FormHelperText, IconButton, Stack, TextField, Typography } from '@mui/material';
import { useEffect } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { SubscriptionForm } from '../../subscription-schema';

interface EventBusTargetProps {
    prodType: BrokerTypes;
}

export const EventBusTarget = ({ prodType }: EventBusTargetProps) => {
    const {
        control,
        formState: { errors },
        register,
        setValue,
        watch,
    } = useFormContext<SubscriptionForm>();
    const { fields, append, remove } = useFieldArray({ name: 'Targets', control });

    const prodTypeFormatted = prodType === 'PRD' ? 'Production' : 'Non-Production';

    const watchTargets = watch('Targets');

    // Reset field if the previoues value was a REST target
    useEffect(() => {
        if (watchTargets[0]?.value.includes('api-destination')) {
            setValue('Targets', [{ value: '' }]);
        }
    }, [setValue, watchTargets]);

    return (
        <>
            <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="h5">{prodTypeFormatted} Event Bus ARN</Typography>
                <Tooltip
                    labelText="Where to get this"
                    tooltipText="Please refer to the EventBus in your AWS console for the Amazon Resource Name (ARN). Copy the ARN and paste it here. Other target types have not yet been enabled on the platform. If this does not meet your requirements, please contact the integration team for assistance."
                    href="mailto: DL-IT-Integration-Platform-Support@woodside.com"
                    linkText=" DL-IT-Integration-Platform-Support@woodside.com"
                />
            </Stack>
            <Stack spacing={1} alignItems="start">
                {fields.map((_field, index) => (
                    <Box key={index} width="100%">
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <TextField
                                fullWidth
                                type="text"
                                variant="standard"
                                placeholder={`Enter ${prodTypeFormatted} Target ARN, eg. arn:aws:events:ap-southeast-2:727026770742:event-bus/EAI-EventBus-DEV`}
                                {...register(`Targets.${index}.value` as const, { shouldUnregister: true })}
                            />
                            {
                                // Only allow delete when more than one target
                                fields.length > 1 && (
                                    <IconButton
                                        onClick={() => {
                                            remove(index);
                                        }}
                                        color="error"
                                        size="small"
                                    >
                                        <DeleteOutlineIcon />
                                    </IconButton>
                                )
                            }
                        </Stack>
                        <ErrorMessage
                            errors={errors}
                            name={`Targets.[${index}]`}
                            render={() => <FormHelperText error>Must provide a valid ARN</FormHelperText>}
                        />
                    </Box>
                ))}
                <ErrorMessage
                    errors={errors}
                    name="Targets"
                    render={({ message }) => <FormHelperText error>{message}</FormHelperText>}
                />
                {prodType === BrokerTypes.NP && (
                    <Button
                        size="small"
                        // Prod accounts can only have 1 target (business rule)
                        // Non prod accounts can add up to 5 EB targets (AWS limitation)
                        startIcon={<AddCircleOutlineIcon />}
                        disabled={fields.length >= 5}
                        onClick={() => {
                            append({ value: '' });
                        }}
                    >
                        <Typography variant="body1">Add additional target</Typography>
                    </Button>
                )}
            </Stack>
        </>
    );
};
