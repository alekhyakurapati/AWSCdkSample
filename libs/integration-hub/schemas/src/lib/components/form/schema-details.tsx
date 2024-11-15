import {
    ApplicationSelector,
    DomainSelector,
    LabeledFormInput,
    Select,
    Tooltip,
} from '@eai-event-integration-platform/integration-hub/shared-ui';
import { ErrorMessage } from '@hookform/error-message';
import { FormHelperText, MenuItem, TextField, Typography } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useFormContext } from 'react-hook-form';
import { formVariantAtom } from '../../atoms';
import { SchemaForm } from './schema-schema';

const EVENT_CLASSIFICATIONS = ['Internal', 'Confidential', 'Most Confidential'];

export const SchemaDetailsForm = () => {
    const variant = useAtomValue(formVariantAtom);
    const isCreateForm = variant === 'create';

    const {
        formState: { errors },
        register,
    } = useFormContext<SchemaForm>();

    return (
        <>
            <Typography variant="h3">Schema Details</Typography>
            <DomainSelector nameTitle="Schema Name" isCreateForm={isCreateForm} includeEventName />
            <LabeledFormInput
                label="Schema Description"
                width="100%"
                input={
                    <TextField
                        fullWidth
                        variant="standard"
                        placeholder="Enter description, eg. New Work Order created in SAP"
                        error={!!errors['Description']}
                        helperText={errors['Description'] && 'Must provide a description'}
                        {...register('Description')}
                    />
                }
            />
            <LabeledFormInput
                label="Event Information Sensitivity"
                tooltip={
                    <Tooltip
                        labelText="What is Information Sensitivity?"
                        tooltipText="Please enter the appropriate information sensitivity for data contained in your event payload. Note: Events containing confidential or mostly confidential information will require data level encryption to comply with Cyber Security Standards. Please refer to the following article for guidance on how to achieve this:"
                        linkText="Confidential Event Architecture"
                        href="https://confluence.woodside.com.au/display/IPOT/Confidential+Event+Architecture"
                    />
                }
                input={
                    <Select variant="standard" name="EventClassification">
                        <MenuItem value="" disabled>
                            Select Classification Level
                        </MenuItem>
                        {EVENT_CLASSIFICATIONS.map((item) => (
                            <MenuItem key={item} value={item.toLowerCase()}>
                                {item}
                            </MenuItem>
                        ))}
                    </Select>
                }
                errorMessage={
                    <ErrorMessage
                        errors={errors}
                        name="EventClassification"
                        render={() => <FormHelperText error>Must select a sensitivity</FormHelperText>}
                    />
                }
            />
            <ApplicationSelector isCreateForm={isCreateForm} />
        </>
    );
};
