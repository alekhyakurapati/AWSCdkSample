import { BackButton, LabeledFormInput, Select } from '@eai-event-integration-platform/integration-hub/shared-ui';
import { BrokerTypes, Connection } from '@eai-event-integration-platform/interfaces';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, Chip, FormHelperText, MenuItem, Skeleton, Stack, TextField, Typography } from '@mui/material';
import { useAtomValue } from 'jotai';
import { FormProvider, useForm } from 'react-hook-form';
import { activeTabAtom, authFormVariantAtom } from '../../atoms';
import { useParams, useLocation } from 'react-router-dom';
import {
    useCreateConnection,
    useFetchAllApplications,
    useFetchConnectionByName,
    useUpdateConnection,
} from '@eai-event-integration-platform/integration-hub/data';
import { ClientCredentialsInput } from './client-creds-input';
import { authorisationFormSchema, IAuthorisationForm, initAuthorisationFormValues } from './form-utils';
import { ErrorMessage } from '@hookform/error-message';

export interface AuthorisationFormProps {
    appName?: string;
    prodType?: string;
    onSaveAddAuthorisation: (authname: string) => void;
    onCancelAddAuthorisation: (isFormDirty?: boolean) => void;
}

export const AuthorisationForm = ({
    appName,
    prodType,
    onSaveAddAuthorisation,
    onCancelAddAuthorisation,
}: AuthorisationFormProps) => {
    const params = useParams();
    const location = useLocation();
    const connectionName = params.connectionName;
    const variant = useAtomValue(authFormVariantAtom);
    const isAddingFormSubs = location.pathname.split('/')[2] === 'subscriptions';
    let isCallerAuthTab = useAtomValue(activeTabAtom) === 0;
    if (isAddingFormSubs) {
        isCallerAuthTab = false;
    }

    const isAddMode = variant === 'create';
    const APIEnvironments = [
        { name: 'Non-Production', brokerType: BrokerTypes.NP },
        { name: 'Production', brokerType: BrokerTypes.PRD },
    ];

    const { data: connectionToBeEdited, isLoading: isLoadingConnectionToBeEdited } =
        useFetchConnectionByName(connectionName);

    const { data: subscriberApplications, isLoading: isLoadingApps } = useFetchAllApplications();
    const { mutate: createConnection } = useCreateConnection();
    const { mutate: updateConnection } = useUpdateConnection();

    const methods = useForm<IAuthorisationForm>({
        values: {
            ...initAuthorisationFormValues(
                isCallerAuthTab ? connectionToBeEdited : undefined,
                appName || '',
                prodType || '',
                variant === 'edit' ? '******' : '',
            ),
        },
        resolver: zodResolver(authorisationFormSchema),
        resetOptions: { keepDirtyValues: true },
        mode: 'onChange',
    });
    const {
        formState: { isDirty, errors },
    } = methods;

    const onClose = () => {
        onCancelAddAuthorisation(isDirty);
    };

    const OnSave = async (values: IAuthorisationForm) => {
        const name = `${values.SubscriberApplication}.${values.Name}.ApiConnection-${values.AuthorizationEnvironment}`;
        const updateConnectionObj: Connection = {
            ConnectionName: name,
            Description: values.Description,
            AuthorizationEndpoint: values.AuthorizationEndpoint,
            HttpMethod: values.HttpMethod,
            ClientID: values.ClientId,
            Broker: prodType ? (prodType as BrokerTypes) : (values.AuthorizationEnvironment as BrokerTypes),
            OwnerRole: appName ? `Event.User.${appName}` : `Event.User.${values.SubscriberApplication}`,
            AppName: appName ? appName : values.SubscriberApplication,
            Scope: values.Scope,
        };

        switch (variant) {
            case 'create': {
                const createConnectionObj: Connection = {
                    ...updateConnectionObj,
                    ClientSecret: values.ClientSecret,
                };
                createConnection(createConnectionObj, {
                    onSuccess: () => {
                        onSaveAddAuthorisation(createConnectionObj.ConnectionName as string);
                    },
                });

                break;
            }

            case 'edit': {
                updateConnection(updateConnectionObj, {
                    onSuccess: () => {
                        onSaveAddAuthorisation(updateConnectionObj.ConnectionName as string);
                    },
                });
                break;
            }

            case 'editCredentials': {
                updateConnectionObj['ClientSecret'] = values.ClientSecret;
                updateConnection(updateConnectionObj, {
                    onSuccess: () => {
                        onSaveAddAuthorisation(updateConnectionObj.ConnectionName as string);
                    },
                });
                break;
            }
        }
    };

    if ((isAddMode && isLoadingApps) || (!isAddMode && isLoadingConnectionToBeEdited)) {
        return (
            <Stack direction="row" justifyContent="center">
                <Skeleton variant="rectangular" width="100%" height={2000} sx={{ borderRadius: 2 }} />
            </Stack>
        );
    }

    return (
        <FormProvider {...methods}>
            {isCallerAuthTab && (
                <BackButton useOnClick={isDirty} onClick={onClose} to="/events/targets/rest-api/authorisations">
                    Back to Manage Target APIs & Authorisations
                </BackButton>
            )}
            <form onSubmit={methods.handleSubmit(OnSave)}>
                <Stack spacing={6} padding={4} sx={{ background: 'white', borderRadius: 2 }}>
                    <Stack spacing={2} direction="row">
                        <Typography variant="h3">Authorisation Details</Typography>
                        {isCallerAuthTab && !isAddMode && (
                            <Box>
                                {connectionToBeEdited?.Broker === BrokerTypes.PRD && (
                                    <Chip
                                        sx={{
                                            fontWeight: '700',
                                            height: '25px',
                                        }}
                                        color="info"
                                        label={<Typography variant="body1">Production</Typography>}
                                    ></Chip>
                                )}
                                {connectionToBeEdited?.Broker === BrokerTypes.NP && (
                                    <Chip
                                        sx={{
                                            fontWeight: '700',
                                            height: '25px',
                                        }}
                                        color="warning"
                                        label={<Typography variant="body1">Non Production</Typography>}
                                    ></Chip>
                                )}
                            </Box>
                        )}
                    </Stack>
                    {isCallerAuthTab && isAddMode && (
                        <LabeledFormInput
                            label="Subscriber Application"
                            input={
                                <Select
                                    variant="standard"
                                    error={!!errors.SubscriberApplication}
                                    name="SubscriberApplication"
                                >
                                    <MenuItem value="" disabled>
                                        Select Subscriber Application
                                    </MenuItem>
                                    {subscriberApplications?.map((item) => (
                                        <MenuItem key={item.ShortName} value={item.ShortName}>
                                            {item.Name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            }
                            errorMessage={
                                <ErrorMessage
                                    errors={errors}
                                    name="SubscriberApplication"
                                    render={() => (
                                        <FormHelperText error>Must select a subscriber application</FormHelperText>
                                    )}
                                />
                            }
                        />
                    )}
                    {isCallerAuthTab && isAddMode && (
                        <LabeledFormInput
                            label="API Environment"
                            input={
                                <Select
                                    variant="standard"
                                    error={!!errors.AuthorizationEnvironment}
                                    name="AuthorizationEnvironment"
                                >
                                    <MenuItem value="" disabled>
                                        Select REST API environment
                                    </MenuItem>

                                    {APIEnvironments.map((item) => (
                                        <MenuItem key={item.name} value={item.brokerType}>
                                            {item.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            }
                            errorMessage={
                                <ErrorMessage
                                    errors={errors}
                                    name="AuthorizationEnvironment"
                                    render={() => <FormHelperText error>Must select an environment</FormHelperText>}
                                />
                            }
                        />
                    )}
                    <LabeledFormInput
                        label="Authorisation Name"
                        input={
                            <TextField
                                type="text"
                                disabled={isCallerAuthTab && !isAddMode}
                                variant="standard"
                                placeholder="eg. SAP Plant Maintenance SerAcc or PRISM API Connection"
                                error={!!errors.Name}
                                helperText={errors.Name?.message}
                                {...methods.register('Name')}
                            />
                        }
                    />

                    <LabeledFormInput
                        label="Description"
                        input={
                            <TextField
                                fullWidth
                                type="text"
                                variant="standard"
                                placeholder="Enter a description for the Authorisation"
                                error={!!errors.Description}
                                helperText={errors.Description?.message}
                                {...methods.register('Description')}
                            />
                        }
                    />
                    <ClientCredentialsInput connection={connectionToBeEdited} />

                    <Stack direction="row" spacing={2} justifyContent="end">
                        <Button variant="text" color="primary" onClick={onClose}>
                            <Typography variant="subtitle1">Cancel</Typography>
                        </Button>
                        <Button variant="contained" color="primary" type="submit">
                            <Typography variant="subtitle1">Save Authorisation</Typography>
                        </Button>
                    </Stack>
                </Stack>
            </form>
        </FormProvider>
    );
};
