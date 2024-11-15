import { atom } from 'jotai';
import { BrokerTypes, Subscription } from '@eai-event-integration-platform/interfaces';

export const activeSubscriptionAtom = atom<Subscription | null>(null);

export const currentFilterAtom = atom<string | undefined>(undefined);

export const deleteConfirmationDialogAtom = atom(false);

export const disableConfirmationDialogAtom = atom(false);

export const confirmExitDialogAtom = atom(false);

export const subsEnvFilterAtom = atom<string | undefined>(undefined);

export const subsSearchQueryAtom = atom<string | undefined>(undefined);

export const subsSourceAppFilterAtom = atom<string | undefined>(undefined);

export const subsSourceStatusFilterAtom = atom<string | undefined>(undefined);

export const subscribingAppAtom = atom<string | undefined>(undefined);

export const subscribingEnvAtom = atom<BrokerTypes | undefined>(undefined);
