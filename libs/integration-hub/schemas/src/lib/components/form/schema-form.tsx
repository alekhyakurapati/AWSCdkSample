import {
    useCreateSchema,
    useFetchAllApplications,
    useFetchDomainsTree,
    useFetchSchemaDetails,
    useUpdateSchema,
} from '@eai-event-integration-platform/integration-hub/data';
import { BackButton, ConfirmationDialog } from '@eai-event-integration-platform/integration-hub/shared-ui';
import { SchemaVersionState } from '@eai-event-integration-platform/interfaces';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Skeleton, Stack, Typography } from '@mui/material';
import { useAtomValue, useSetAtom } from 'jotai';
import { FormProvider, useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    activeSchemaAtom,
    confirmExitDialogOpenAtom,
    confirmPublishDialogOpenAtom,
    formVariantAtom,
} from '../../atoms';
import { initSchemaForm } from './init-form';
import { SchemaDefinitionForm } from './schema-definition';
import { SchemaDetailsForm } from './schema-details';
import { SchemaForm as ISchemaForm, schemaFormSchema } from './schema-schema';
import * as lodash from 'lodash';

export const SchemaForm = () => {
    const formVariant = useAtomValue(formVariantAtom);
    const isCreateForm = formVariant === 'create';
    const { isLoading: isLoadingDomains } = useFetchDomainsTree({ enabled: isCreateForm });
    const { isLoading: isLoadingApps } = useFetchAllApplications();
    const navigate = useNavigate();
    const location = useLocation();
    const activeSchema = useAtomValue(activeSchemaAtom);
    const { data: schema, isLoading: isLoadingSchema } = useFetchSchemaDetails(activeSchema);
    const { mutate: registerSchema } = useCreateSchema();
    const { mutate: updateSchema } = useUpdateSchema();
    const setConfirmExitDialog = useSetAtom(confirmExitDialogOpenAtom);
    const setConfirmPublishDialog = useSetAtom(confirmPublishDialogOpenAtom);
    const isCreateNewVersion = formVariant === 'definition' && schema?.State === SchemaVersionState.PUBL;

    const methods = useForm<ISchemaForm>({
        values: {
            ...initSchemaForm(schema),
        },
        resolver: zodResolver(schemaFormSchema),
        resetOptions: { keepDirtyValues: true },
        mode: 'onChange',
    });

    const {
        formState: { isDirty },
    } = methods;

    const onSave = async ({
        Content,
        Description,
        EventClassification,
        EventName,
        SchemaSupportGroup,
        Application,
        Domain,
    }: ISchemaForm) => {
        setConfirmPublishDialog(false);
        const subSubDomain = Domain.SubSubDomain === 'OTHER' ? Domain.CustomSubSubDomain : Domain.SubSubDomain;

        const domain = `wel.${Domain.Domain}.${Domain.SubDomain}${(subSubDomain?.length ?? 0) > 0 ? '.' : ''}${
            subSubDomain ?? ''
        }`;
        const schemaName = `${domain}@${EventName}`;
        const { CINumber: AppCINumber, CostCode, Owner: SchemaOwner, ShortName: AppName } = Application;

        const schemaObj = {
            Content,
            Description,
            SchemaName: schemaName,
            AppName,
            CostCode,
            EventClassification,
            SchemaOwner,
            SchemaSupportGroup,
            OwnerRole: `Event.User.${AppName}`,
            AppCINumber,
            Domain: domain,
        };

        if (isCreateForm) {
            registerSchema(schemaObj, {
                onSuccess: () => {
                    navigate(`/events/schemas/${encodeURIComponent(schemaName)}/1`, { replace: true });
                },
            });
        } else {
            updateSchema(schemaObj, {
                onSuccess: (data) => {
                    const version = isCreateNewVersion ? data.Version : activeSchema?.Version;
                    navigate(`/events/schemas/${encodeURIComponent(schemaName)}/${version ?? 1}`);
                },
            });
        }
    };

    const onSavePubl = () => {
        const { examples: currentExamples, ...currentContent } = JSON.parse(methods.getValues('Content'));
        const { examples: originalExamples, ...originalContent } = JSON.parse(schema!.Content!);
        if (!lodash.isEqual(currentContent, originalContent)) {
            setConfirmPublishDialog(true);
        } else {
            methods.handleSubmit(onSave)();
        }
    };

    // Loading apps and domains for a new form, or loading an existing schema
    if ((isCreateForm && (isLoadingApps || isLoadingDomains)) || (!isCreateForm && isLoadingSchema)) {
        return (
            <Stack direction="row" justifyContent="center">
                <Skeleton variant="rectangular" width="100%" height={2000} sx={{ borderRadius: 2 }} />
            </Stack>
        );
    }

    return (
        <FormProvider {...methods}>
            <ConfirmationDialog
                dialogOpenAtom={confirmPublishDialogOpenAtom}
                title="Are you sure you want to publish a new version?"
                body="By making changes to an already published schema, you will be creating a new draft schema definition. Are you sure you wish to do so?"
                handleConfirmation={methods.handleSubmit(onSave)}
                confirmationText="Publish new draft"
            />
            <BackButton
                useOnClick={isDirty}
                onClick={() => setConfirmExitDialog(true)}
                to={location.state?.from ?? '/events'}
            >
                Back to Catalogue
            </BackButton>
            <form onSubmit={methods.handleSubmit(onSave)}>
                <Stack spacing={6} padding={4} sx={{ background: 'white', borderRadius: 2 }}>
                    {(formVariant === 'create' || formVariant === 'details') && <SchemaDetailsForm />}
                    {(formVariant === 'create' || formVariant === 'definition') && <SchemaDefinitionForm />}
                    <Stack direction="row" spacing={2} justifyContent="end">
                        <Button
                            variant="text"
                            color="primary"
                            to={location.state?.from ?? '/events'}
                            onClick={isDirty ? () => setConfirmExitDialog(true) : undefined}
                            component={isDirty ? 'button' : Link}
                        >
                            <Typography variant="subtitle1">Cancel</Typography>
                        </Button>
                        {isCreateNewVersion ? (
                            <Button
                                variant="contained"
                                color="primary"
                                type="button"
                                disabled={!isDirty}
                                onClick={onSavePubl}
                            >
                                <Typography variant="subtitle1">Save Changes</Typography>
                            </Button>
                        ) : (
                            <Button variant="contained" color="primary" type="submit" disabled={!isDirty}>
                                <Typography variant="subtitle1">
                                    {formVariant === 'create' ? 'Save to Non-Production' : 'Save Changes'}
                                </Typography>
                            </Button>
                        )}
                    </Stack>
                </Stack>
            </form>
        </FormProvider>
    );
};
