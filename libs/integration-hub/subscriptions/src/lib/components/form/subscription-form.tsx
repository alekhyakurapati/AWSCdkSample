import {
    useCreateSubscription,
    useFetchAllApplications,
    useFetchDomainsTree,
    useFetchSchemaDetails,
    useFetchSubscription,
    useUpdateSubscription,
} from '@eai-event-integration-platform/integration-hub/data';
import { ApplicationSelector, BackButton } from '@eai-event-integration-platform/integration-hub/shared-ui';
import { BrokerTypes, SubscriptionState } from '@eai-event-integration-platform/interfaces';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Skeleton, Stack, Typography } from '@mui/material';
import { useSetAtom } from 'jotai';
import { FormProvider, useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { confirmExitDialogAtom } from '../../atoms';
import { useSubscriptionFormResolver } from '../../hooks';
import { FormVariant } from '../../types';
import { initCreateSubscriptionForm, initEditSubscriptionForm } from './init-form';
import { SubscriptionDetailsForm } from './sub-forms/subscription-details';
import { TargetDetailsForm } from './sub-forms/target-details';
import { EventRule, SubscriptionForm as ISubscriptionForm } from './subscription-schema';

interface SubscriptionFormProps {
    variant: FormVariant;
}

const safeParse = (input: string) => {
    try {
        return JSON.parse(input);
    } catch (_) {
        return '';
    }
};

export const SubscriptionForm = ({ variant }: SubscriptionFormProps) => {
    const isCreateForm = variant === 'create';
    const { isLoading: isLoadingApps } = useFetchAllApplications({ enabled: isCreateForm });
    const { isLoading: isLoadingDomains } = useFetchDomainsTree({ enabled: isCreateForm });
    const location = useLocation();
    const navigate = useNavigate();
    const params = useParams();
    const activeSchema = location.state?.activeSchema;
    const prodType = location.state?.prodType as BrokerTypes | undefined;
    const isProd = prodType === 'PRD';
    const { data: schema, isLoading: isLoadingSchema } = useFetchSchemaDetails(activeSchema);
    const { data: subscription, isLoading: isLoadingSubscription } = useFetchSubscription(params.subscriptionName);
    const { mutate: createSubscription } = useCreateSubscription();
    const { mutate: updateSubscription } = useUpdateSubscription();
    const setConfirmationDialogOpen = useSetAtom(confirmExitDialogAtom);

    const methods = useForm<ISubscriptionForm>({
        values: {
            ...(isCreateForm
                ? initCreateSubscriptionForm({ schema, prodType })
                : initEditSubscriptionForm(subscription)),
        },
        resolver: zodResolver(useSubscriptionFormResolver(schema, isProd)),
        // Used to asynchronously update values from ReactQuery
        resetOptions: { keepDirtyValues: true },
        mode: 'onChange',
    });

    const {
        formState: { isDirty },
    } = methods;

    const handleCreateSuccess = () => {
        if (location.state?.from) {
            navigate(location.state.from, { state: { navigateToSubscriptionsTab: true } });
        } else if (schema?.SchemaName) {
            navigate(`/events/schemas/${encodeURIComponent(schema?.SchemaName)}/1`, {
                state: { navigateToSubscriptionsTab: true },
            });
        } else {
            navigate('/events/subscriptions');
        }
    };

    const handleUpdateSuccess = () => {
        navigate('/events/subscriptions');
    };

    const onSave = async ({ Application, Broker, Description, Domain, RulePattern, Targets }: ISubscriptionForm) => {
        const targets = Targets.map((target) => target.value);

        const subSubDomain = Domain.SubSubDomain === 'OTHER' ? Domain.CustomSubSubDomain ?? '' : Domain.SubSubDomain;

        const ruleName = `wel.${Domain.Domain}.${Domain.SubDomain}.${subSubDomain}`;
        const parsedSchema = safeParse(RulePattern) as EventRule;
        const schemaName = `${parsedSchema.source[0]}@${parsedSchema['detail-type'][0]}`;
        const ownerRole = `Event.User.${Application.ShortName}`;

        const body = {
            SubscribingDomain: ruleName,
            Description,
            RulePattern: RulePattern,
            SchemaVersion: parsedSchema.detail.Metadata.Version[0],
            SchemaName: schemaName,
            Targets: targets,
            Broker,
            CostCode: Application.CostCode,
            AppName: Application.ShortName,
            AppCINumber: Application.CINumber,
            SubscriptionOwner: Application.Owner,
            OwnerRole: subscription?.OwnerRole ?? ownerRole,
            State: subscription?.State ?? SubscriptionState.ENABLED,
        };

        if (isCreateForm) createSubscription(body, { onSuccess: handleCreateSuccess });
        else updateSubscription({ ...body, Name: subscription?.Name ?? '' }, { onSuccess: handleUpdateSuccess });
    };

    if (isCreateForm && (!location.state?.activeSchema || !location.state?.prodType)) {
        return <Typography>Error: could not find schema</Typography>;
    }

    if (
        (isCreateForm && (isLoadingApps || isLoadingDomains || isLoadingSchema)) ||
        (!isCreateForm && isLoadingSubscription)
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

    return (
        <FormProvider {...methods}>
            <BackButton
                useOnClick={isDirty}
                onClick={() => {
                    setConfirmationDialogOpen(true);
                }}
                to={location.state?.from ?? (isCreateForm ? '/events' : '/events/subscriptions')}
            >
                {isCreateForm ? 'Back to Catalogue' : 'Back to Manage Subscriptions'}
            </BackButton>
            <form onSubmit={methods.handleSubmit(onSave)}>
                <Stack spacing={6} padding={4} sx={{ background: 'white', borderRadius: 2 }}>
                    <Typography variant="h3">Subscriber Details</Typography>
                    <ApplicationSelector isCreateForm={isCreateForm} />

                    <SubscriptionDetailsForm isCreateForm={isCreateForm} />
                    <TargetDetailsForm prodType={prodType ?? BrokerTypes.NP} />
                    <Stack direction="row" justifyContent="end" paddingTop={4}>
                        <Button
                            variant="text"
                            color="primary"
                            component={isDirty ? 'button' : Link}
                            onClick={isDirty ? () => setConfirmationDialogOpen(true) : undefined}
                            to={location.state?.from ?? (isCreateForm ? '/events' : '/events/subscriptions')}
                        >
                            <Typography variant="subtitle1">Cancel</Typography>
                        </Button>
                        <Button variant="contained" color="primary" type="submit" disabled={!isDirty}>
                            <Typography variant="subtitle1">
                                {isCreateForm
                                    ? prodType === BrokerTypes.NP
                                        ? 'Subscribe to Non-Production Event'
                                        : 'Subscribe to Production Event'
                                    : 'Save Changes'}
                            </Typography>
                        </Button>
                    </Stack>
                </Stack>
            </form>
        </FormProvider>
    );
};
