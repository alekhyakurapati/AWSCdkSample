import { TextEditor } from '@eai-event-integration-platform/integration-hub/shared-ui';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Box, Stack, Typography, useTheme } from '@mui/material';
import { useFormContext } from 'react-hook-form';
import { SchemaForm } from './schema-schema';
import { ExampleStatus } from './example-status';

export const SchemaDefinitionForm = () => {
    const {
        formState: { errors },
    } = useFormContext<SchemaForm>();
    const { palette } = useTheme();

    return (
        <>
            <Typography variant="h3">Schema Definition</Typography>
            {/* // NOTE: MUI 'grid' is actually a flexbox, for a CSS grid, the below is reccomended */}
            <Box
                sx={{
                    background: 'rgb(46, 52, 64)',
                    borderRadius: 4,
                    color: palette.grey[300],
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    overflowX: 'auto',
                }}
            >
                <Stack
                    alignItems="center"
                    borderBottom={1}
                    borderRight={1}
                    borderColor={palette.grey[700]}
                    direction="row"
                    justifyContent="space-between"
                    padding={2}
                >
                    <Typography variant="body1" flexGrow={1}>
                        Example Event
                    </Typography>
                    <ExampleStatus />
                </Stack>
                <Stack
                    alignItems="center"
                    borderBottom={1}
                    borderColor={palette.grey[700]}
                    direction="row"
                    justifyContent="space-between"
                    padding={2}
                >
                    <Typography variant="body1">Schema Definition</Typography>
                    {errors.Content ? (
                        <Stack direction="row" spacing={2} alignItems="center">
                            <CancelIcon color="error" />
                            <Typography variant="body1" color={palette.error.main}>
                                Schema is invalid
                            </Typography>
                        </Stack>
                    ) : (
                        <Stack direction="row" spacing={2} alignItems="center">
                            <CheckCircleIcon color="success" />
                            <Typography variant="body1" color={palette.success.main}>
                                Schema is valid
                            </Typography>
                        </Stack>
                    )}
                </Stack>
                <Box borderRight={1} borderColor={palette.grey[700]} paddingBottom={2}>
                    <TextEditor name="Example" />
                </Box>
                <Box paddingBottom={2}>
                    <TextEditor name="Content" />
                </Box>
            </Box>
        </>
    );
};
