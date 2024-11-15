import { ButtonWithIcon } from '@eai-event-integration-platform/integration-hub/shared-ui';
import { Destination } from '@eai-event-integration-platform/interfaces';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Stack, Typography, useTheme } from '@mui/material';
import { useCallback, useState } from 'react';

export interface ActiveApisdropdownPRops {
    restApis: Destination[];
}

export const ActiveApisdropdown = ({ restApis }: ActiveApisdropdownPRops) => {
    const { palette } = useTheme();
    const [expanded, setExpanded] = useState<boolean>(false);
    const onExpand = useCallback(() => {
        setExpanded(!expanded);
    }, [expanded]);

    return (
        <Stack spacing={0.5}>
            <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                <Typography variant="body2" textTransform="uppercase" color={palette.grey[600]}>
                    API Dependencies ({restApis.length})
                </Typography>
                {!expanded && restApis && restApis.length > 3 && (
                    <ButtonWithIcon
                        endIcon={<ExpandMoreIcon />}
                        onClick={() => onExpand()}
                        sx={{ color: palette.grey[600] }}
                    >
                        Show All
                    </ButtonWithIcon>
                )}

                {expanded && restApis && restApis.length > 3 && (
                    <ButtonWithIcon
                        endIcon={<ExpandLessIcon />}
                        onClick={() => onExpand()}
                        sx={{ color: palette.grey[600] }}
                    >
                        Hide
                    </ButtonWithIcon>
                )}
            </Stack>
            <Typography variant="subtitle1" fontWeight="bold"></Typography>
            {expanded &&
                restApis?.map((item) => {
                    return (
                        <Typography key={item.Description} color={palette.grey[800]} variant="body1">
                            {item.DestinationName}
                        </Typography>
                    );
                })}

            {!expanded &&
                restApis?.slice(0, 3).map((item) => {
                    return (
                        <Typography key={item.Description} color={palette.grey[800]} variant="body1">
                            {item.DestinationName}
                        </Typography>
                    );
                })}
        </Stack>
    );
};
