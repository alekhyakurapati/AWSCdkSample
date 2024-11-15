import { ButtonWithIcon } from '@eai-event-integration-platform/integration-hub/shared-ui';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FileOpenIcon from '@mui/icons-material/FileOpen';
import { Stack, Typography, useTheme } from '@mui/material';
import { useFormContext } from 'react-hook-form';
import { parseSchema } from './parse-schema';
import { SchemaForm } from './schema-schema';

const HEIGHT = 36;

export const ExampleStatus = () => {
    const {
        formState: { dirtyFields, errors },
        setValue,
        watch,
    } = useFormContext<SchemaForm>();
    const { palette } = useTheme();

    const watchExample = watch('Example');
    const isError = Boolean(errors.Example);
    const isDirty = dirtyFields.Example ?? false;

    const onSubmitGenerateSchema = () => {
        setValue('Content', parseSchema(watchExample));
    };

    if (isError)
        return (
            <Stack direction="row" alignItems="center" spacing={2} height={HEIGHT}>
                <CancelIcon color="error" />
                <Typography variant="body1" color={palette.error.main}>
                    JSON is invalid
                </Typography>
            </Stack>
        );

    if (isDirty)
        return (
            <ButtonWithIcon
                size="small"
                variant="contained"
                color="info"
                onClick={onSubmitGenerateSchema}
                startIcon={<FileOpenIcon />}
                sx={{ height: HEIGHT }}
            >
                Re-generate Schema
            </ButtonWithIcon>
        );

    return (
        <Stack direction="row" alignItems="center" spacing={2} height={HEIGHT}>
            <CheckCircleIcon color="success" />
            <Typography variant="body1" color={palette.success.main}>
                JSON is valid
            </Typography>
        </Stack>
    );
};
