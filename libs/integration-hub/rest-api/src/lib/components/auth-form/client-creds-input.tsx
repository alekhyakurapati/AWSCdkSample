import { LabeledFormInput, Select } from '@eai-event-integration-platform/integration-hub/shared-ui';
import { Button, FormHelperText, MenuItem, Stack, TextField, Typography, useTheme } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useFormContext } from 'react-hook-form';
import { authFormVariantAtom } from '../../atoms';
import { IAuthorisationForm } from './form-utils';
import { useSearchParams } from 'react-router-dom';
import { Connection } from '@eai-event-integration-platform/interfaces';
import { ErrorMessage } from '@hookform/error-message';

interface ClientCredentialsInputProps {
    connection?: Connection;
}
export const ClientCredentialsInput = ({ connection }: ClientCredentialsInputProps) => {
    const formVariant = useAtomValue(authFormVariantAtom);
    const isAddMode = formVariant === 'create';
    const isPartialEditMode = formVariant === 'edit';
    const isEditCredentials = formVariant === 'editCredentials';
    const httpMethods = ['GET', 'POST', 'PUT'];
    const { palette } = useTheme();
    const [_searchParams, setSearchParams] = useSearchParams();

    const {
        formState: { errors },
        register,
        getValues,
        resetField,
    } = useFormContext<IAuthorisationForm>();

    const toggleMode = () => {
        if (isEditCredentials) {
            setSearchParams();
            resetField('ClientId');
            resetField('ClientSecret');
            resetField('Scope');
        } else {
            setSearchParams({ credentials: '1' });
        }
    };
    return (
        <>
            <Typography variant="h3">OAuth Client Credentials</Typography>
            <LabeledFormInput
                label="HTTP Method"
                input={
                    <Select variant="standard" error={!!errors.HttpMethod} name="HttpMethod">
                        <MenuItem value="" disabled>
                            -- Select HTTP Method --
                        </MenuItem>

                        {httpMethods.map((item, index) => (
                            <MenuItem key={index} value={item}>
                                {item}
                            </MenuItem>
                        ))}
                    </Select>
                }
                errorMessage={
                    <ErrorMessage
                        errors={errors}
                        name="HttpMethod"
                        render={() => <FormHelperText error>Must select a HTTP Method</FormHelperText>}
                    />
                }
            />

            <LabeledFormInput
                label="Authorisation Endpoint"
                input={
                    <TextField
                        fullWidth
                        type="text"
                        variant="standard"
                        placeholder="Enter URL to the end point to connect to the authorisation"
                        error={!!errors.AuthorizationEndpoint}
                        helperText={errors.AuthorizationEndpoint?.message}
                        {...register('AuthorizationEndpoint')}
                    />
                }
            />

            {(isAddMode || isEditCredentials) && (
                <>
                    <Stack spacing={2} sx={{ width: 500 }}>
                        <Stack direction="row" spacing={4} sx={{ alignItems: 'center' }}>
                            <Typography variant="h5">Client ID</Typography>
                            {isEditCredentials && (
                                <Button size="small" variant="outlined" color="primary" onClick={toggleMode}>
                                    <Typography>Cancel</Typography>
                                </Button>
                            )}
                        </Stack>
                        <TextField
                            type="text"
                            variant="standard"
                            placeholder="Enter the Client ID for the credentials to use for authorisation."
                            error={!!errors.ClientId}
                            helperText={errors.ClientId?.message}
                            {...register('ClientId')}
                        />
                    </Stack>

                    <LabeledFormInput
                        label="Client Secret"
                        input={
                            <TextField
                                type="password"
                                variant="standard"
                                placeholder="Enter the Client Secret for the credentials to use for authorisation."
                                error={!!errors.ClientSecret}
                                helperText={errors.ClientSecret?.message}
                                {...register('ClientSecret')}
                            />
                        }
                    />

                    <LabeledFormInput
                        label="Scope"
                        input={
                            <TextField
                                variant="standard"
                                placeholder="Enter the Scope for the credentials to use for authorisation."
                                error={!!errors.Scope}
                                helperText={errors.Scope?.message}
                                {...register('Scope')}
                            />
                        }
                    />
                </>
            )}
            {isPartialEditMode && (
                <>
                    <Stack spacing={2} sx={{ width: 500 }}>
                        <Stack direction="row" spacing={4} sx={{ alignItems: 'center' }}>
                            <Typography variant="h5">Client ID</Typography>
                            <Button size="small" variant="outlined" color="primary" onClick={toggleMode}>
                                <Typography>Edit Client Authorisation</Typography>
                            </Button>
                        </Stack>
                        <Typography color={palette.grey[500]}>{getValues('ClientId')}</Typography>
                    </Stack>

                    <LabeledFormInput
                        label="Client Secret"
                        input={<Typography color={palette.grey[500]}>{getValues('ClientSecret')}</Typography>}
                    />
                    <LabeledFormInput
                        label="Scope"
                        input={<Typography color={palette.grey[500]}>{getValues('Scope')}</Typography>}
                    />
                </>
            )}
        </>
    );
};
