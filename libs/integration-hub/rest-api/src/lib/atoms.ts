import { atom } from 'jotai';
import { Connection, Destination } from '@eai-event-integration-platform/interfaces';
import { AuthFormVariant } from './types';

export const activeTabAtom = atom(0);

export const activeTargetApiAtom = atom<Destination | null>(null);

export const activeAuthorisationAtom = atom<Connection | null>(null);

export const deleteConfirmationTargetApiDialogAtom = atom(false);

export const deleteConfirmationAuthorisationDialogAtom = atom(false);

export const authViewConfirmExitDialogOpenAtom = atom(false);

export const apiViewConfirmExitDialogOpenAtom = atom(false);

export const authFormDialogAtom = atom(false);

export const authDialogConfirmExitDialogAtom = atom(false);

export const authFormVariantAtom = atom<AuthFormVariant | undefined>(undefined);
