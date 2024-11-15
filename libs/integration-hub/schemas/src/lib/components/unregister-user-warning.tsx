import WarningIcon from '@mui/icons-material/Warning';
import { Link, Stack, Typography, useTheme } from '@mui/material';

export const UnregisteredUserWarning = () => {
    const { palette } = useTheme();
    return (
        <Stack direction="row" bgcolor={palette.warning.main} paddingX={4} paddingY={4} borderRadius={1} spacing={3}>
            <WarningIcon style={{ fontSize: '44px' }} />
            <Typography variant="body1">
                Your profile is not configured to Register a Schema or Subscribe to Events. Request the user entitlement
                via the{' '}
                <Link href="https://ssm-saviyntcloud.woodside.com.au/ECM/workflowmanagement/requesthome?menu=1">
                    Access Management (Savyint).
                </Link>{' '}
                If you are unable to find the Access Role you require access to, please request Event Integration
                Platform Producer Onboarding via the{' '}
                <Link href="https://woodside.service-now.com/navpage.do">ServiceNow catalogue item.</Link>
            </Typography>
        </Stack>
    );
};
