import { FailureMessage } from '@eai-event-integration-platform/interfaces';
import { atom } from 'jotai';
import { DateTime } from 'luxon';

export const activeTabAtom = atom(0);

export const currentFailureMessageAtom = atom<FailureMessage | undefined>(undefined);

export const viewPayloadDialogOpenAtom = atom<boolean>(false);

export const eventSourceAppFilterAtom = atom<string | undefined>(undefined);

export const eventSubsIdFilterAtom = atom<string | undefined>(undefined);

export const eventTargetArnFilterAtom = atom<string | undefined>(undefined);

export const eventCurrentFilterAtom = atom<string | undefined>(undefined);

export const eventStartTimestampAtom = atom<DateTime | null>(null);

export const eventEndTimestampAtom = atom<DateTime | null>(null);

export const eventUpdatedTimestampAtom = atom<boolean>(false);
