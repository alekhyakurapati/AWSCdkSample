import {
    createRestTargetDialogAtom,
    selectedDestAtom,
    subsApiConfirmExitDialogOpenAtom,
    targetAPIsFormVariantAtom,
    useCreateDestination,
    useFetchAllApplications,
    useFetchConnections,
    useFetchDestinationByName,
    useUpdateDestination,
} from '@eai-event-integration-platform/integration-hub/data';
import {
    BackButton,
    LabeledFormInput,
    Select,
    Tooltip,
} from '@eai-event-integration-platform/integration-hub/shared-ui';
import { BrokerTypes, Destination } from '@eai-event-integration-platform/interfaces';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Box,
    Button,
    Chip,
    FormHelperText,
    MenuItem,
    Skeleton,
    Stack,
    TextField,
    Typography,
    Alert,
} from '@mui/material';
import { useAtomValue, useSetAtom } from 'jotai';
import { useCallback } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiViewConfirmExitDialogOpenAtom, authFormDialogAtom } from '../../atoms';
import { AuthorisationFormDialog } from './auth-form-dialog';
import { AuthInput } from './auth-input';
import { initTargetAPIsFormValues, ITargetAPIsForm, TargetAPIsFormSchema } from './form-utils';
import { ErrorMessage } from '@hookform/error-message';

export interface TargetApisFormProps {
    appName?: string;
    prodType?: BrokerTypes;
}

export const TargetApisForm = ({ appName, prodType }: TargetApisFormProps) => {
    const navigate = useNavigate();
    const params = useParams();
    const destinationName = params.destinationName;
    const connectionName = params.connectionName;
    const variant = useAtomValue(targetAPIsFormVariantAtom);
    const setSubsApiConfirmExitDialog = useSetAtom(subsApiConfirmExitDialogOpenAtom);
    const isAddMode = variant === 'create';
    const isEditMode = variant === 'edit';
    const isAddFromSubsMode = variant === 'createFromSubscriptionForm';

    const httpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];
    const APIEnvironments = [
        { name: 'Non-Production', brokerType: BrokerTypes.NP },
        { name: 'Production', brokerType: BrokerTypes.PRD },
    ];
    const setAuthDialogOpen = useSetAtom(authFormDialogAtom);
    const setDialogOpen = useSetAtom(createRestTargetDialogAtom);
    const setSelectedDest = useSetAtom(selectedDestAtom);

    const { refetch: fetchConnections, isLoading: isLoadingConnections } = useFetchConnections();
    const { data: destinationToBeEdited, isLoading: isLoadingDestinationToBeEdited } = useFetchDestinationByName(
        connectionName,
        destinationName,
    );

    const { data: subscriberApplications, isLoading: isLoadingApplications } = useFetchAllApplications();
    const setConfirmExitDialog = useSetAtom(apiViewConfirmExitDialogOpenAtom);
    const { mutate: createDestination } = useCreateDestination();
    const { mutate: updateDestination } = useUpdateDestination(connectionName);

    const methods = useForm<ITargetAPIsForm>({
        values: {
            ...initTargetAPIsFormValues(destinationToBeEdited, appName || '', prodType || ''),
        },
        resolver: zodResolver(TargetAPIsFormSchema),
        resetOptions: { keepDirtyValues: true },
        mode: 'onChange',
    });
    const {
        formState: { isDirty, errors },
        setValue,
        watch,
    } = methods;

    const apiEnvironment = watch('APIEnvironment');
    const subscriberApp = watch('SubscriberApplication');

    /* on Submitting New Authorization Form */
    const onSaveNewAuth = useCallback(
        (newauth: string) => {
            fetchConnections();
            setValue('AuthSelection', newauth);
            setAuthDialogOpen(false);
        },
        [fetchConnections, setAuthDialogOpen, setValue],
    );

    const OnSave = async (values: ITargetAPIsForm) => {
        const name = `${values.SubscriberApplication}.${values.Name}.ApiDestination-${values.APIEnvironment}`;

        const body: Destination = {
            DestinationName: name,
            Description: values.Description,
            InvocationEndpoint: values.ApiEndpoint,
            HttpMethod: values.HttpMethod,
            InvocationRateLimitPerSecond: values.InvocationRate ? values.InvocationRate : 1,
            Broker: prodType ? prodType : (values.APIEnvironment as BrokerTypes),
            ConnectionName: values.AuthSelection,
            OwnerRole: appName ? `Event.User.${appName}` : `Event.User.${values.SubscriberApplication}`,
            AppName: appName ? appName : values.SubscriberApplication,
        };

        switch (variant) {
            case 'create': {
                const createDestinationDto: Destination = {
                    ...body,
                };
                createDestination(createDestinationDto, {
                    onSuccess: () => {
                        navigate('/events/targets/rest-api');
                    },
                });

                break;
            }

            case 'createFromSubscriptionForm': {
                const createDestinationDto: Destination = {
                    ...body,
                };
                createDestination(createDestinationDto, {
                    onSuccess: (data) => {
                        setDialogOpen(false);
                        setSelectedDest(data.DestinationArn);
                    },
                });

                break;
            }

            case 'edit': {
                updateDestination(body, {
                    onSuccess: () => {
                        navigate('/events/targets/rest-api');
                    },
                });
                break;
            }
        }
    };

    if (
        (isAddMode && (isLoadingConnections || isLoadingApplications)) ||
        (isEditMode && isLoadingDestinationToBeEdited)
    ) {
        return (
            <Stack spacing={2} padding={4} sx={{ background: 'white', borderRadius: 2 }}>
                {Array(8)
                    .fill(null)
                    .map((_, i) => (
                        <Skeleton key={i} height={100} />
                    ))}
            </Stack>
        );
    }

    const handleCancel = () => {
        if (isAddFromSubsMode) {
            if (isDirty) {
                setSubsApiConfirmExitDialog(true);
            } else {
                setDialogOpen(false);
            }
        } else if (isDirty) {
            setConfirmExitDialog(true);
        }
    };

    return (
        <>
            <AuthorisationFormDialog
                subscriberApplication={subscriberApp}
                environment={apiEnvironment as BrokerTypes}
                onSaveAddAuthorisation={onSaveNewAuth}
            />

            <FormProvider {...methods}>
                {!isAddFromSubsMode && (
                    <BackButton
                        useOnClick={isDirty}
                        onClick={isDirty ? () => setConfirmExitDialog(true) : undefined}
                        to="/events/targets/rest-api/"
                    >
                        Back to Manage Target APIs & Authorisations
                    </BackButton>
                )}
                <form onSubmit={methods.handleSubmit(OnSave)}>
                    <Stack spacing={6} padding={4} sx={{ background: 'white', borderRadius: 2 }}>
                        <Alert sx={{ border: '1px solid#FFD094' }} severity="warning">
                            EventBridge requests to an API destination endpoint must have a maximum client execution
                            timeout of 5 seconds. If the target endpoint takes longer than 5 seconds to respond,
                            EventBridge times out the request. EventBridge retries timed out requests up to the maximums
                            that are configured on your retry policy (currently 24 hours and 185 times). After the
                            maximum number of retries, events are sent to your dead-letter-queue
                        </Alert>
                        <Stack spacing={2} direction="row">
                            <Typography variant="h3">REST API Details</Typography>
                            {isEditMode && (
                                <Box>
                                    {destinationToBeEdited?.Broker === BrokerTypes.PRD && (
                                        <Chip
                                            sx={{
                                                backgroundColor: '#BCE5F8',

                                                fontWeight: '700',
                                                height: '25px',
                                            }}
                                            label={<Typography variant="body1">Production</Typography>}
                                        ></Chip>
                                    )}
                                    {destinationToBeEdited?.Broker === BrokerTypes.NP && (
                                        <Chip
                                            sx={{
                                                backgroundColor: '#FFCC80',

                                                fontWeight: '700',
                                                height: '25px',
                                            }}
                                            label={<Typography variant="body1">Non Production</Typography>}
                                        ></Chip>
                                    )}
                                </Box>
                            )}
                        </Stack>
                        {isAddMode && (
                            <LabeledFormInput
                                label="Subscriber Application"
                                input={
                                    <Select
                                        variant="standard"
                                        error={!!errors.SubscriberApplication}
                                        name="SubscriberApplication"
                                        disabled={isEditMode}
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
                        {isAddMode && (
                            <LabeledFormInput
                                label="API Environment"
                                input={
                                    <Select
                                        variant="standard"
                                        error={!!errors.APIEnvironment}
                                        name="APIEnvironment"
                                        disabled={isEditMode}
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
                                        name="APIEnvironment"
                                        render={() => <FormHelperText error>Must select an environment</FormHelperText>}
                                    />
                                }
                            />
                        )}
                        <LabeledFormInput
                            label="Rest API Name"
                            input={
                                <TextField
                                    type="text"
                                    variant="standard"
                                    error={!!errors.Name}
                                    disabled={isEditMode}
                                    helperText={errors.Name?.message}
                                    placeholder="Enter a unique name"
                                    {...methods.register('Name')}
                                />
                            }
                        />
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
                            label="Rest API Endpoint"
                            tooltip={
                                <Tooltip
                                    tooltipText="The URL endpoint to invoke as a target. For example, a valid endpoint generated by a partner service. Note that the URL must start with https:// and you can include * as path parameters wildcards to be set from the Target HttpParameters."
                                    labelText={'Rest API Endpoint'}
                                />
                            }
                            input={
                                <TextField
                                    fullWidth
                                    type="text"
                                    variant="standard"
                                    placeholder="Enter a URL endpoint for the REST API"
                                    error={!!errors.ApiEndpoint}
                                    helperText={errors.ApiEndpoint?.message}
                                    {...methods.register('ApiEndpoint')}
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
                                    placeholder="Enter a description for the Target API"
                                    error={!!errors.Description}
                                    helperText={errors.Description?.message}
                                    {...methods.register('Description')}
                                />
                            }
                        />
                        <LabeledFormInput
                            label="Invocation Rate Limit per second"
                            input={
                                <TextField
                                    fullWidth
                                    type="number"
                                    variant="standard"
                                    placeholder="Enter an Invovation Rate"
                                    error={!!errors.InvocationRate}
                                    helperText={errors.InvocationRate?.message}
                                    {...methods.register('InvocationRate', { valueAsNumber: true })}
                                />
                            }
                        />
                        <AuthInput />
                        <Stack direction="row" spacing={2} justifyContent="end">
                            <Button
                                variant="text"
                                color="primary"
                                component={isDirty || isAddFromSubsMode ? 'button' : Link}
                                onClick={isDirty || isAddFromSubsMode ? handleCancel : undefined}
                                to={'/events/targets/rest-api/'}
                            >
                                <Typography variant="subtitle1">Cancel</Typography>
                            </Button>
                            <Button variant="contained" color="primary" type="submit">
                                <Typography variant="subtitle1">Save REST API</Typography>
                            </Button>
                        </Stack>
                    </Stack>
                </form>
            </FormProvider>
        </>
    );
};
