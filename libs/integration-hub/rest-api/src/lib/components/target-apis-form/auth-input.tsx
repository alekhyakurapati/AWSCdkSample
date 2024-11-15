import { useFetchConnections } from '@eai-event-integration-platform/integration-hub/data';
import {
    FormActionButton,
    FORM_INPUT_WIDTH,
    LabeledFormInput,
    Select,
    Tooltip,
} from '@eai-event-integration-platform/integration-hub/shared-ui';
import { Connection } from '@eai-event-integration-platform/interfaces';
import { FormHelperText, MenuItem, Stack, Typography, useTheme } from '@mui/material';
import { useSetAtom } from 'jotai';
import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { authFormDialogAtom, authFormVariantAtom } from '../../atoms';
import { ITargetAPIsForm } from './form-utils';
import { ErrorMessage } from '@hookform/error-message';

export const AuthInput = () => {
    const { data: connections } = useFetchConnections();
    const setAuthDialogOpen = useSetAtom(authFormDialogAtom);
    const setAuthFormVariant = useSetAtom(authFormVariantAtom);
    const { palette } = useTheme();

    const {
        formState: { errors },
        watch,
    } = useFormContext<ITargetAPIsForm>();

    const onAddNewAuth = () => {
        setAuthDialogOpen(true);
        setAuthFormVariant('create');
    };

    const apiEnvironment = watch('APIEnvironment');
    const subscriberApp = watch('SubscriberApplication');

    const filteredConnections = useMemo(() => {
        let result = [] as Connection[];
        if (connections) {
            result = connections.filter((item) => item.Broker === apiEnvironment && item.AppName === subscriberApp);
        }
        return result;
    }, [connections, apiEnvironment, subscriberApp]);

    if (!subscriberApp || !apiEnvironment)
        return (
            <LabeledFormInput
                label="API Authorisation Details"
                input={
                    <Typography variant="body1" color={palette.error.contrastText}>
                        Please select an application and environment first
                    </Typography>
                }
            />
        );

    return (
        <>
            {(!connections || connections.length === 0) && (
                <LabeledFormInput
                    label="Authorisation"
                    input={
                        <Stack spacing={2} alignItems="start">
                            <Typography variant="body1" color={palette.error.contrastText}>
                                No existing connections. Please create a new one
                            </Typography>
                            <FormActionButton handleFormAction={onAddNewAuth}>Add New Authorisation</FormActionButton>
                        </Stack>
                    }
                />
            )}
            {filteredConnections && filteredConnections.length > 0 && (
                <LabeledFormInput
                    width="100%"
                    label="API Authorisation Details"
                    input={
                        <Stack direction="row" gap={2} flexWrap="wrap">
                            <Select
                                variant="standard"
                                error={!!errors.AuthSelection}
                                name="AuthSelection"
                                sx={{ width: FORM_INPUT_WIDTH }}
                            >
                                <MenuItem value="" disabled>
                                    -- Select Authorisation --
                                </MenuItem>
                                {filteredConnections.map((item, index) => (
                                    <MenuItem key={index} value={item.ConnectionName}>
                                        {item.ConnectionName}
                                    </MenuItem>
                                ))}
                            </Select>
                            <FormActionButton handleFormAction={onAddNewAuth}>Add New Authorisation</FormActionButton>
                        </Stack>
                    }
                    errorMessage={
                        <ErrorMessage
                            errors={errors}
                            name="AuthSelection"
                            render={() => <FormHelperText error>Must select an Authorisation</FormHelperText>}
                        />
                    }
                />
            )}
        </>
    );
};
