import { atom } from 'jotai';

export const createRestTargetDialogAtom = atom(false);
export const selectedDestAtom = atom<string | undefined>(undefined);
export const subsApiConfirmExitDialogOpenAtom = atom(false);
