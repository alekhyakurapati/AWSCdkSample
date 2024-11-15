import { useFetchConnectionAuthStatus } from '@eai-event-integration-platform/integration-hub/data';
import { ButtonWithIcon } from '@eai-event-integration-platform/integration-hub/shared-ui';
import { BrokerTypes, Connection, ConnectionAuthStatus, Destination } from '@eai-event-integration-platform/interfaces';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Card, CardContent, Chip, Skeleton, Stack, Typography, useTheme } from '@mui/material';
import { useSetAtom } from 'jotai';
import { Link } from 'react-router-dom';
import { activeAuthorisationAtom, deleteConfirmationAuthorisationDialogAtom } from '../atoms';
import { ActiveApisdropdown } from './active-apis-dropdown';

export interface AuthorisationCardProps {
    connection: Connection;
    destinations: Destination[] | undefined;
}

export const AuthorisationCard = ({ connection, destinations }: AuthorisationCardProps) => {
    const {
        data: authStatus,
        isLoading,
        isError,
    } = useFetchConnectionAuthStatus({
        conName: connection.ConnectionName ?? '',
    });
    const { palette } = useTheme();

    const isProd = connection.Broker === BrokerTypes.PRD;
    const isAuth = authStatus === ConnectionAuthStatus.AUTHORIZED;

    const setActiveAuthorisation = useSetAtom(activeAuthorisationAtom);
    const setDialogOpen = useSetAtom(deleteConfirmationAuthorisationDialogAtom);

    const handleDelete = () => {
        setActiveAuthorisation(connection);
        setDialogOpen(true);
    };

    if (isError) return <Typography>Encountered an error, please try refreshing</Typography>;

    if (isLoading) {
        return (
            <Stack spacing={2}>
                {Array(12)
                    .fill(null)
                    .map((_, i) => (
                        <Skeleton key={i} variant="rectangular" height={220} />
                    ))}
            </Stack>
        );
    }

    return (
        <Card>
            <CardContent>
                <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Typography sx={{ fontWeight: '600' }} variant="subtitle1">
                                {connection.ConnectionName}
                            </Typography>
                            <Chip
                                size="small"
                                label={isProd ? 'Production' : 'Non Production'}
                                color={isProd ? 'warning' : undefined}
                            />
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <ButtonWithIcon
                                size="small"
                                variant="outlined"
                                startIcon={<EditIcon fontSize="small" />}
                                LinkComponent={Link}
                                to={`/events/targets/rest-api/authorisations/${encodeURIComponent(
                                    connection.ConnectionName ?? '',
                                )}/edit`}
                            >
                                Edit
                            </ButtonWithIcon>
                            <ButtonWithIcon
                                size="small"
                                variant="outlined"
                                disabled={destinations && destinations.length > 0}
                                startIcon={<DeleteIcon fontSize="small" />}
                                onClick={handleDelete}
                            >
                                Delete
                            </ButtonWithIcon>
                        </Stack>
                    </Stack>
                    <Stack spacing={0.5}>
                        <Typography variant="body2" textTransform="uppercase" color={palette.grey[600]}>
                            Description
                        </Typography>
                        <Typography color={palette.grey[800]} variant="body1">
                            {connection.Description}
                        </Typography>
                    </Stack>
                    <Stack direction="row" spacing={8}>
                        <Stack direction="row" spacing={1}>
                            <Stack spacing={0.5}>
                                <Typography variant="body2" textTransform="uppercase" color={palette.grey[600]}>
                                    Authorisation Endpoint:
                                </Typography>
                                <Stack direction="row" spacing={1}>
                                    <Typography color={palette.grey[800]} variant="body1">
                                        {connection.AuthorizationEndpoint}
                                    </Typography>
                                    <Chip
                                        size="small"
                                        label={authStatus.toLowerCase()}
                                        color={isAuth ? 'success' : 'error'}
                                        sx={{ textTransform: 'capitalize' }}
                                    />
                                </Stack>
                            </Stack>
                        </Stack>
                        <Stack spacing={0.5}>
                            <Typography variant="body2" textTransform="uppercase" color={palette.grey[600]}>
                                Client ID
                            </Typography>
                            <Typography color={palette.grey[800]} variant="body1">
                                {connection.ClientID}
                            </Typography>
                        </Stack>
                        {destinations && destinations.length > 0 && <ActiveApisdropdown restApis={destinations} />}
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );
};
