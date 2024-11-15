import { PrimitiveAtom } from 'jotai';
import { ConfirmationDialog } from '../confirmation-dialog';

interface Props {
    dialogOpenAtom: PrimitiveAtom<boolean>;
    handleNavigate: () => void;
}

export const ConfirmExitDialog = ({ dialogOpenAtom, handleNavigate }: Props) => (
    <ConfirmationDialog
        dialogOpenAtom={dialogOpenAtom}
        handleConfirmation={handleNavigate}
        title="You may have unsaved changes!"
        body="Are you sure you want to go back?"
        confirmationText="Discard changes"
    />
);
