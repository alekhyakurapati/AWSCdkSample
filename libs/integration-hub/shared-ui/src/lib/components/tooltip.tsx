import HelpIcon from '@mui/icons-material/Help';
import {
    Link,
    Stack,
    styled,
    Tooltip as MuiTooltip,
    tooltipClasses,
    TooltipProps as MuiTooltipProps,
    Typography,
    useTheme,
} from '@mui/material';

interface TooltipProps {
    labelText: string;
    tooltipText: string;
    href?: string;
    linkText?: string;
}

const StyledTooltip = styled(({ className, ...props }: MuiTooltipProps) => (
    <MuiTooltip {...props} classes={{ popper: className }} />
))(({ theme: { palette, shadows } }) => ({
    [`& .${tooltipClasses.tooltip}`]: {
        backgroundColor: palette.grey[900],
        color: palette.grey[50],
        boxShadow: shadows[1],
        fontSize: 11,
    },
}));

export const Tooltip = ({ labelText, tooltipText, href, linkText }: TooltipProps) => {
    const { palette } = useTheme();
    return (
        <StyledTooltip
            title={
                <Stack spacing={2} padding={2}>
                    <Typography variant="subtitle1">{labelText}</Typography>
                    <Typography variant="body2" sx={{ wordBreak: 'keep-all' }}>
                        {tooltipText}
                        {href && (
                            <Link
                                variant="body2"
                                target="_blank"
                                href={href}
                                color="secondary"
                                sx={{ wordBreak: 'keep-all' }}
                            >
                                {` ${linkText}`}
                            </Link>
                        )}
                    </Typography>
                </Stack>
            }
        >
            <HelpIcon fontSize="small" sx={{ color: palette.grey[700] }} />
        </StyledTooltip>
    );
};
