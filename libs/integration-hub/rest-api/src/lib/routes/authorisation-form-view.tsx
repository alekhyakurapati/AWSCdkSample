import { ConfirmExitDialog, NAVBAR_HEIGHT } from '@eai-event-integration-platform/integration-hub/shared-ui';
import { Box, Typography, useTheme } from '@mui/material';
import { useAtom, useSetAtom } from 'jotai';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useWindowSize } from 'usehooks-ts';
import { authFormVariantAtom, authViewConfirmExitDialogOpenAtom } from '../atoms';
import { AuthorisationForm } from '../components/auth-form/auth-form';

export const AuthorisationFormView = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { palette } = useTheme();
    const setConfirmExitDialog = useSetAtom(authViewConfirmExitDialogOpenAtom);
    const [formVariant, setFormVariant] = useAtom(authFormVariantAtom);
    const screen = useWindowSize();
    const title = formVariant === 'create' ? 'Add API Authorisation' : 'Edit API Authorisation ';

    useEffect(() => {
        if (location.pathname.endsWith('/create')) {
            setFormVariant('create');
        } else if (location.search.includes('credentials')) {
            setFormVariant('editCredentials');
        } else {
            setFormVariant('edit');
        }
    }, [location, setFormVariant]);

    const handleNavigate = () => {
        setConfirmExitDialog(false);
        navigate('/events/targets/rest-api/authorisations');
    };

    const onCloseAddAuthorisation = (isFormDirty?: boolean) => {
        if (isFormDirty) {
            setConfirmExitDialog(true);
        } else {
            navigate('/events/targets/rest-api/authorisations');
        }
    };

    const onSaveAddAuthorisation = () => {
        navigate('/events/targets/rest-api/authorisations');
    };

    return (
        <>
            <ConfirmExitDialog dialogOpenAtom={authViewConfirmExitDialogOpenAtom} handleNavigate={handleNavigate} />
            <Box
                sx={{
                    background: palette.grey[100],
                    minHeight: screen.height - NAVBAR_HEIGHT,
                    paddingX: { xs: 4, lg: 16, xl: 25 },
                    paddingY: 8,
                }}
            >
                <Typography variant="h1" color={palette.grey[800]} marginBottom={2}>
                    {title}
                </Typography>

                <AuthorisationForm
                    onSaveAddAuthorisation={onSaveAddAuthorisation}
                    onCancelAddAuthorisation={onCloseAddAuthorisation}
                />
            </Box>
        </>
    );
};
