import { convertTimeStamp, extractTargetArn } from '@eai-event-integration-platform/integration-hub/shared-ui';
import { FailureMessage } from '@eai-event-integration-platform/interfaces';
import OpenInBrowserIcon from '@mui/icons-material/OpenInBrowser';
import {
    Link,
    Tooltip as MuiTooltip,
    TooltipProps as MuiTooltipProps,
    TableCell,
    TableRow,
    Typography,
    styled,
    tooltipClasses,
    useTheme,
} from '@mui/material';
import { useSetAtom } from 'jotai';
import { currentFailureMessageAtom, viewPayloadDialogOpenAtom } from '../atoms';

export interface TableRowsInputProps {
    row: FailureMessage;
    index: number;
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

export const TableRows = (propsInput: TableRowsInputProps) => {
    const theme = useTheme();
    const MIN_WIDTH = 10;

    const setCurrentFailureMessage = useSetAtom(currentFailureMessageAtom);
    const setViewPayloadDialogOpen = useSetAtom(viewPayloadDialogOpenAtom);

    return (
        <TableRow key={propsInput.index}>
            <TableCell align="left" sx={{ minWidth: MIN_WIDTH }}>
                <Typography>{propsInput.row.SubscriptionId}</Typography>
            </TableCell>
            <TableCell align="left" sx={{ minWidth: MIN_WIDTH }}>
                <StyledTooltip
                    placement="bottom"
                    title={
                        <Typography variant="body2" sx={{ color: theme.palette.common.white }}>
                            {propsInput.row.TargetArn}
                        </Typography>
                    }
                >
                    <Typography variant="subtitle2">
                        ...
                        {extractTargetArn(propsInput.row.TargetArn)}
                    </Typography>
                </StyledTooltip>
            </TableCell>
            <TableCell align="left" sx={{ minWidth: MIN_WIDTH }}>
                <Typography variant="subtitle2">{convertTimeStamp(propsInput.row.EventTimestamp)}</Typography>
            </TableCell>
            <TableCell align="left" sx={{ minWidth: MIN_WIDTH }}>
                <Typography variant="subtitle2">{convertTimeStamp(propsInput.row.SentTimestamp)}</Typography>
            </TableCell>
            <TableCell align="left" sx={{ minWidth: MIN_WIDTH }}>
                <Typography variant="subtitle2">{propsInput.row.ErrorCode}</Typography>
            </TableCell>
            <TableCell align="left" sx={{ minWidth: MIN_WIDTH }}>
                <Typography variant="subtitle2">{propsInput.row.ErrorMessage}</Typography>
            </TableCell>
            <TableCell align="left" sx={{ minWidth: MIN_WIDTH }}>
                <Typography variant="subtitle2">{propsInput.row.RetryAttempts}</Typography>
            </TableCell>
            <TableCell align="left" sx={{ minWidth: MIN_WIDTH }}>
                <Link
                    color="secondary"
                    sx={{
                        cursor: 'pointer',
                        textDecoration: 'none',
                        fontWeight: '900',
                    }}
                    onClick={() => {
                        setCurrentFailureMessage(propsInput.row);
                        setViewPayloadDialogOpen(true);
                    }}
                >
                    <OpenInBrowserIcon color="primary" />
                </Link>
            </TableCell>
        </TableRow>
    );
};
