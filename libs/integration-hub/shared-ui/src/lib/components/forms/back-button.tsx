import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { ReactNode } from 'react';
import { Link, To } from 'react-router-dom';
import { ButtonWithIcon } from '../button-with-icon';
import { NAVBAR_HEIGHT } from '../navbar';

interface Props {
    useOnClick?: boolean; // Either use onClick *OR* to
    onClick?: () => void;
    to?: To;
    children: ReactNode;
}

export const BackButton = ({ useOnClick, onClick, to, children }: Props) => (
    <ButtonWithIcon
        startIcon={<ArrowBackIcon />}
        onClick={useOnClick ? onClick : undefined}
        to={useOnClick ? undefined : to}
        LinkComponent={Link}
        sx={{ left: 8, position: 'absolute', top: NAVBAR_HEIGHT + 8 }}
    >
        {children}
    </ButtonWithIcon>
);
