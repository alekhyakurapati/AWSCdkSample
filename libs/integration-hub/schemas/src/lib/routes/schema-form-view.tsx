import { ConfirmExitDialog, NAVBAR_HEIGHT } from '@eai-event-integration-platform/integration-hub/shared-ui';
import { Box, Typography, useTheme } from '@mui/material';
import { useAtom, useSetAtom } from 'jotai';
import { useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useWindowSize } from 'usehooks-ts';
import { activeSchemaAtom, confirmExitDialogOpenAtom, formVariantAtom } from '../atoms';
import { SchemaForm } from '../components/form/schema-form';
import { FormVariant } from '../types';

export interface SchemaFormViewProps {
    variant: FormVariant;
}

export const SchemaFormView = ({ variant }: SchemaFormViewProps) => {
    const params = useParams();
    const [activeSchema, setActiveSchema] = useAtom(activeSchemaAtom);
    const setFormVariant = useSetAtom(formVariantAtom);
    const { palette } = useTheme();
    const screen = useWindowSize();
    const setDialogOpen = useSetAtom(confirmExitDialogOpenAtom);
    const navigate = useNavigate();
    const location = useLocation();

    setFormVariant(variant);

    useEffect(() => {
        if (params.SchemaName) {
            setActiveSchema({
                SchemaName: params.SchemaName,
                Version: params?.Version ? parseInt(params.Version) : activeSchema?.Version ?? 1,
            });
        } else {
            setActiveSchema(undefined);
        }
    }, [params, activeSchema?.Version, setActiveSchema]);

    const handleNavigate = () => {
        setDialogOpen(false);
        navigate(location.state?.from ?? '/events');
    };

    const headerText = (() => {
        switch (variant) {
            case 'create':
                return 'Register New Schema';

            case 'details':
                return 'Edit Schema Details';

            case 'definition':
                return 'Edit Schema Definition';
        }
    })();

    return (
        <>
            <ConfirmExitDialog dialogOpenAtom={confirmExitDialogOpenAtom} handleNavigate={handleNavigate} />
            <Box
                sx={{
                    background: palette.grey[100],
                    minHeight: screen.height - NAVBAR_HEIGHT,
                    paddingX: { xs: 4, lg: 16, xl: 25 },
                    paddingY: 8,
                }}
            >
                <Typography variant="h1" color={palette.grey[800]} marginBottom={2}>
                    {headerText}
                </Typography>
                <SchemaForm />
            </Box>
        </>
    );
};
