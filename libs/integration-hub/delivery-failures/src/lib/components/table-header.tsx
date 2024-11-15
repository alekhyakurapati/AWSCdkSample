import { Box, TableHead, TableRow, TableCell, Typography, useTheme } from '@mui/material';
import { Tooltip } from '@eai-event-integration-platform/integration-hub/shared-ui';

export const TableHeader = () => {
    const theme = useTheme();

    const MIN_WIDTH = 12.5;
    const ROW_BACKGROUND = theme.palette.grey[100];

    const headers = [
        'Subscription ID',
        'Target',
        'Event Time (UTC)',
        'Failure Time (UTC)',
        'Error Reason',
        'Error Message',
        'Retry Attempts',
        'View Details',
    ];

    return (
        <TableHead>
            <TableRow>
                {headers.map((header, index) => {
                    if (header === 'Subscription ID') {
                        return (
                            <TableCell
                                key={index}
                                align="left"
                                sx={{ backgroundColor: ROW_BACKGROUND, minWidth: MIN_WIDTH }}
                            >
                                <Box display="flex" alignItems="center">
                                    <Typography variant="subtitle2" sx={{ paddingRight: 1 }}>
                                        {header}
                                    </Typography>
                                    <Tooltip
                                        labelText={header}
                                        tooltipText={`Subscription ID consists of <Application>.<Domain>.<EventDetail>.<ID>`}
                                    />
                                </Box>
                            </TableCell>
                        );
                    } else {
                        return (
                            <TableCell
                                key={index}
                                align="left"
                                sx={{ backgroundColor: ROW_BACKGROUND, minWidth: MIN_WIDTH }}
                            >
                                <Typography variant="subtitle2">{header}</Typography>
                            </TableCell>
                        );
                    }
                })}
            </TableRow>
        </TableHead>
    );
};
