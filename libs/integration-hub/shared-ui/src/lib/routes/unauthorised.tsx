import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Box, Link, Stack, Typography, useTheme } from '@mui/material';

export const UnauthorisedPage = () => {
    const theme = useTheme();

    return (
        <Stack
            spacing={2}
            sx={{
                background: theme.palette.warning.light,
                color: theme.palette.warning.contrastText,
                marginX: 8,
                marginY: 16,
                padding: 2,
            }}
        >
            <WarningAmberIcon sx={{ height: 128, marginX: 'auto', width: 128 }} />

            <Typography variant="h4" textAlign="center">
                You are not authorised to view this page
            </Typography>
            <Box>
                <Typography variant="body1" component="span">
                    To have access to register new schemas, manage existing schemas, subscribe to events and manage
                    existing subscriptions, you must request the appropriate user entitlement via the
                </Typography>{' '}
                <Link
                    variant="body1"
                    component="a"
                    target="_blank"
                    href="https://ssm-saviyntcloud.woodside.com.au/ECM/workflowmanagement/requesthome?menu=1"
                >
                    Access Management (Savyint)
                </Link>{' '}
                <Typography variant="body1" component="span">
                    solution. User entitlements can be found under the Integration Platform application within Savyint.
                </Typography>
            </Box>
            <Box>
                <Typography variant="body1" component="span">
                    If you are unable to find the application you require access to, please request Event Integration
                    Platform Application Onboarding via the
                </Typography>{' '}
                <Link
                    variant="body1"
                    component="a"
                    target="_blank"
                    href="https://woodside.service-now.com/sp?id=sc_cat_item&sys_id=719a840fdbc89d10b6f3401d34961907"
                >
                    ServiceNow catalogue item.
                </Link>
            </Box>
        </Stack>
    );
};
