import { useFetchDomainsTree } from '@eai-event-integration-platform/integration-hub/data';
import { ErrorMessage } from '@hookform/error-message';
import { FormHelperText, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Tooltip } from '../tooltip';
import { Select } from './select';

interface DomainSelectorProps {
    nameTitle: string;
    isCreateForm: boolean;
    includeEventName?: boolean;
}

interface FormValues {
    Domain: {
        Domain: string;
        SubDomain: string;
        SubSubDomain: string;
        CustomSubSubDomain: string;
    };
    EventName: string;
}

export const DomainSelector = ({ nameTitle, isCreateForm, includeEventName }: DomainSelectorProps) => {
    const { data: domains } = useFetchDomainsTree({ enabled: isCreateForm });
    const {
        formState: { errors },
        register,
        setValue,
        clearErrors,
        setError,
        watch,
    } = useFormContext<FormValues>();

    // Find Subdomains / Subsubdomains as parent value updates
    const watchDomain = watch('Domain.Domain');
    const subDomains = domains?.find((domain) => domain.Name === watchDomain)?.Children;
    const watchSubDomain = watch('Domain.SubDomain');
    const subSubDomains = subDomains?.find((subDomain) => subDomain.Name === watchSubDomain)?.Children;
    const watchSubSubDomain = watch('Domain.SubSubDomain');
    const watchCustomSubSubDomain = watch('Domain.CustomSubSubDomain');

    // Error state when sub sub domain not selected
    useEffect(() => {
        if (subSubDomains && watchSubSubDomain === '') {
            setError('Domain.SubSubDomain', { type: 'required', message: 'Must select a sub sub domain' });
        } else {
            clearErrors('Domain.SubSubDomain');
        }
    }, [subSubDomains, watchSubSubDomain, setError, clearErrors]);

    // Error state when custom sub sub domain not provided
    useEffect(() => {
        if (watchSubSubDomain === 'OTHER' && watchCustomSubSubDomain === '') {
            setError('Domain.CustomSubSubDomain', {
                type: 'required',
                message: 'Must provide a custom sub sub domain',
            });
        } else {
            clearErrors('Domain.CustomSubSubDomain');
        }
    }, [watchSubSubDomain, watchCustomSubSubDomain, setError, clearErrors]);

    // Reset dependent field when parent changes
    useEffect(() => {
        if (isCreateForm) setValue('Domain.SubDomain', '');
    }, [watchDomain, setValue, isCreateForm]);
    useEffect(() => {
        if (isCreateForm) setValue('Domain.SubSubDomain', '');
    }, [watchSubDomain, setValue, isCreateForm]);
    useEffect(() => {
        if (isCreateForm) setValue('Domain.CustomSubSubDomain', '');
    }, [watchSubSubDomain, setValue, isCreateForm]);

    const errorFields = ['Domain.Domain', 'Domain.SubDomain', 'Domain.SubSubDomain', 'Domain.CustomSubSubDomain'];
    if (includeEventName) errorFields.push('EventName');

    return (
        <Stack spacing={2}>
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                <Typography variant="h5">{nameTitle}</Typography>
                <Tooltip
                    labelText="How to define a Schema Name"
                    tooltipText="Schema names should represent the business domain events. These are sourced from, and must align to, the requirements of the "
                    linkText="Event Naming Standard."
                    href="https://confluence.woodside.com.au/display/IPOT/Event+Name+Taxonomy+and+Payload+Structure"
                />
            </Stack>
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                <TextField type="text" variant="standard" disabled={true} value="wel" sx={{ width: 32 }} />
                <Typography>•</Typography>
                <Select
                    variant="standard"
                    disabled={!isCreateForm}
                    error={!!errors.Domain?.Domain}
                    sx={{ flexGrow: 1 }}
                    name="Domain.Domain"
                >
                    <MenuItem value="" disabled>
                        Select Business Domain
                    </MenuItem>
                    {isCreateForm ? (
                        domains?.map((domain) => (
                            <MenuItem key={domain.Name} value={domain.Name}>
                                {domain.Name}
                            </MenuItem>
                        ))
                    ) : (
                        <MenuItem value={watchDomain}>{watchDomain}</MenuItem>
                    )}
                </Select>
                <Typography>•</Typography>
                <Select
                    variant="standard"
                    disabled={!isCreateForm || watchDomain === ''}
                    error={!!errors.Domain?.SubDomain}
                    sx={{ flexGrow: 1 }}
                    name="Domain.SubDomain"
                >
                    <MenuItem value="" disabled>
                        Select Sub Domain
                    </MenuItem>
                    {isCreateForm ? (
                        subDomains?.map((subDomain) => (
                            <MenuItem key={subDomain.Name} value={subDomain.Name}>
                                {subDomain.Name}
                            </MenuItem>
                        ))
                    ) : (
                        <MenuItem value={watchSubDomain}>{watchSubDomain}</MenuItem>
                    )}
                </Select>
                <Typography>•</Typography>
                {isCreateForm && subSubDomains !== undefined ? (
                    // When subsubdomains are defined use a select
                    <Select
                        variant="standard"
                        disabled={!isCreateForm || watchSubDomain === ''}
                        error={!!errors.Domain?.SubSubDomain}
                        sx={{ flexGrow: 1 }}
                        name="Domain.SubSubDomain"
                    >
                        <MenuItem value="" disabled>
                            Select Sub Sub Domain
                        </MenuItem>
                        {subSubDomains?.map((subSubDomain) => (
                            <MenuItem key={subSubDomain.Name} value={subSubDomain.Name}>
                                {subSubDomain.Name}
                            </MenuItem>
                        ))}
                        <MenuItem value="OTHER">*Other</MenuItem>
                    </Select>
                ) : (
                    // When subsubdomains are not defined use a textbox
                    <TextField
                        type="text"
                        variant="standard"
                        placeholder="Enter Sub Sub Domain/Project (Optional)"
                        error={!!errors.Domain?.SubSubDomain}
                        disabled={!isCreateForm || watchSubDomain === ''}
                        sx={{ flexGrow: 1 }}
                        {...register('Domain.SubSubDomain')}
                    />
                )}
                {includeEventName && (
                    <>
                        <Typography>@</Typography>
                        <TextField
                            disabled={!isCreateForm}
                            variant="standard"
                            type="text"
                            placeholder="EventName"
                            error={!!errors['EventName']}
                            sx={{ flexGrow: 1 }}
                            {...register('EventName')}
                        />
                    </>
                )}
            </Stack>
            {subSubDomains !== undefined && watchSubSubDomain === 'OTHER' && (
                <TextField
                    sx={{ marginY: 1 }}
                    type="text"
                    variant="standard"
                    placeholder="Enter Custom Sub Sub Domain"
                    fullWidth
                    error={!!errors.Domain?.CustomSubSubDomain}
                    {...register('Domain.CustomSubSubDomain')}
                />
            )}
            {(errors.Domain || errors.EventName) && (
                <Stack>
                    {errorFields.map((name, i) => (
                        <ErrorMessage
                            key={i}
                            errors={errors}
                            name={name}
                            render={({ message }) => <FormHelperText error>{`• ${message}`}</FormHelperText>}
                        />
                    ))}
                </Stack>
            )}
        </Stack>
    );
};
