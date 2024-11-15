import {
    DomainSelector,
    LabeledFormInput,
    TextEditor,
    Tooltip,
} from '@eai-event-integration-platform/integration-hub/shared-ui';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Box, Stack, TextField, Typography, useTheme } from '@mui/material';
import { useFormContext } from 'react-hook-form';
import { SubscriptionForm } from '../subscription-schema';

interface DetailsFormProps {
    isCreateForm: boolean;
}

export const SubscriptionDetailsForm = ({ isCreateForm }: DetailsFormProps) => {
    const {
        formState: { errors },
        register,
    } = useFormContext<SubscriptionForm>();
    const { palette } = useTheme();

    return (
        <>
            <Typography variant="h3">Subscription Details</Typography>
            <DomainSelector nameTitle="Subscription Name" isCreateForm={isCreateForm} />
            <LabeledFormInput
                label="Subscription Description"
                width="100%"
                input={
                    <TextField
                        fullWidth
                        variant="standard"
                        placeholder="Enter Description (eg. Automatically creates ISSOW Permit with SAP Work Order)"
                        error={!!errors['Description']}
                        helperText={errors['Description'] && 'Must provide a description'}
                        {...register('Description')}
                    />
                }
            />

            <LabeledFormInput
                label="Event Filter"
                width="100%"
                input={
                    <Box
                        sx={{
                            background: 'rgb(46, 52, 64)',
                            borderRadius: 4,
                            color: palette.grey[300],
                            overflowX: 'auto',
                        }}
                    >
                        <Stack
                            alignItems="center"
                            borderBottom={1}
                            borderColor={palette.grey[700]}
                            direction="row"
                            justifyContent="space-between"
                            padding={2}
                        >
                            <Typography variant="body1">Event Rule</Typography>
                            {errors.RulePattern ? (
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <CancelIcon color="error" />
                                    <Typography variant="body1" color={palette.error.main}>
                                        {errors.RulePattern.message}
                                    </Typography>
                                </Stack>
                            ) : (
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <CheckCircleIcon color="success" />
                                    <Typography variant="body1" color={palette.success.main}>
                                        Schema is valid
                                    </Typography>
                                </Stack>
                            )}
                        </Stack>
                        <TextEditor name="RulePattern" />
                    </Box>
                }
                // TODO: include this once the docs page is published
                // tooltip={
                //     <Tooltip
                //         labelText="How to specify an event filter"
                //         tooltipText="For details on specifying an event filter, please consult our"
                //         href="TODO"
                //         linkText="documentation"
                //     />
                // }
            />
        </>
    );
};
