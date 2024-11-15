import { useFetchAllApplications } from '@eai-event-integration-platform/integration-hub/data';
import { ErrorMessage } from '@hookform/error-message';
import { FormHelperText, MenuItem, TextField } from '@mui/material';
import { useFormContext } from 'react-hook-form';
import { Tooltip } from '../tooltip';
import { LabeledFormInput } from './labeled-form-input';
import { Select } from './select';

interface AppSelectorProps {
    isCreateForm: boolean;
}

interface FormValues {
    Application: {
        CINumber: string;
        CostCode: string;
        Owner: string;
        ShortName: string;
    };
    SchemaSupportGroup: string;
}

export const ApplicationSelector = ({ isCreateForm }: AppSelectorProps) => {
    const { data: subscriberApplications } = useFetchAllApplications({ enabled: isCreateForm });

    const {
        formState: { errors },
        register,
        setValue,
        watch,
    } = useFormContext<FormValues>();

    const watchAppShortName = watch('Application.ShortName');
    if (isCreateForm) {
        const app = subscriberApplications?.find((app) => app.ShortName === watchAppShortName);
        // Update dependent fields on parent change
        setValue('Application.CINumber', app?.CINumber ?? '');
        setValue('Application.CostCode', app?.CostCode ?? '');
        setValue('Application.Owner', app?.Owner ?? '');
        setValue('SchemaSupportGroup', app?.SupportEmail?.join(', ') ?? '');
    }

    return (
        <>
            <LabeledFormInput
                label="Application"
                input={
                    <Select
                        variant="standard"
                        disabled={!isCreateForm}
                        error={!!errors?.Application?.ShortName}
                        name="Application.ShortName"
                    >
                        <MenuItem value="" disabled>
                            Select Application
                        </MenuItem>
                        {isCreateForm ? (
                            subscriberApplications?.map((item) => (
                                <MenuItem key={item.ShortName} value={item.ShortName}>
                                    {item.Name}
                                </MenuItem>
                            ))
                        ) : (
                            <MenuItem value={watchAppShortName}>{watchAppShortName}</MenuItem>
                        )}
                    </Select>
                }
                errorMessage={
                    <ErrorMessage
                        errors={errors}
                        name="Application.ShortName"
                        render={() => <FormHelperText error>Must select a subscriber application</FormHelperText>}
                    />
                }
            />

            <LabeledFormInput
                label="Schema Owner"
                tooltip={
                    <Tooltip
                        labelText="Owner Name Needs Updating?"
                        tooltipText="This owner was nominated at the time of onboarding the application. If you need it updated please contact the:"
                        linkText="DL-IT-Integration-Platform-Support@woodside.com"
                        href="mailto:DL-IT-Integration-Platform-Support@woodside.com"
                    />
                }
                input={<TextField disabled={true} type="text" variant="standard" {...register('Application.Owner')} />}
            />

            {/* TODO: use 'SupportEmail' to populate this field */}
            {/* <LabeledFormInput */}
            {/*     label="Support Contact" */}
            {/*     tooltip={ */}
            {/*         <Tooltip */}
            {/*             labelText="Assignment Group Needs Updating?" */}
            {/*             tooltipText="This assignment group was nominated at the time of onboarding the application. If you need it updated please contact the:" */}
            {/*             linkText=" DL-IT-Integration-Platform-Support@woodside.com" */}
            {/*             href="mailto: DL-IT-Integration-Platform-Support@woodside.com" */}
            {/*         /> */}
            {/*     } */}
            {/*     input={<TextField disabled={true} type="text" variant="standard" {...register('SchemaSupportGroup')} />} */}
            {/* /> */}

            <LabeledFormInput
                label="Cost Code"
                tooltip={
                    <Tooltip
                        labelText="Cost Code Needs Updating?"
                        tooltipText="The chargeback model for the Integration platform is currently under review. For further information or to update your cost code, please contact:"
                        linkText=" DL-IT-Integration-Platform-Support@woodside.com"
                        href="mailto: DL-IT-Integration-Platform-Support@woodside.com"
                    />
                }
                input={
                    <TextField disabled={true} type="text" variant="standard" {...register('Application.CostCode')} />
                }
            />
        </>
    );
};
