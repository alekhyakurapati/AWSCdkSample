import { ActiveSchema } from '@eai-event-integration-platform/integration-hub/data';
import { atom } from 'jotai';
import Scrollbars from 'react-custom-scrollbars-2';
import { FormVariant, SchemaSortingOption } from '../types';

export const activeSchemaAtom = atom<ActiveSchema | undefined>(undefined);

export const activeTabAtom = atom('definition');

export const activeSubscriptionTabAtom = atom('subs-production');

export const activeRecentEventsTabAtom = atom('recentEvent-production');

export const domainFilterAtom = atom([] as string[]);

export const confirmExitDialogOpenAtom = atom(false);

export const confirmPublishDialogOpenAtom = atom(false);

export const drawerOpenAtom = atom(false);

export const formVariantAtom = atom<FormVariant | undefined>(undefined);

export const publishDialogOpenAtom = atom(false);

export const schemaPageAtom = atom<number>(1);

export const schemaSearchQueryAtom = atom<string>('');

export const schemaSortOptionAtom = atom<SchemaSortingOption | null>(SchemaSortingOption.LAST_UPDATED_DESC);

export const appFilterAtom = atom([] as string[]);

export const schemaPageScrollBarAtom = atom<Scrollbars | null>(null);
