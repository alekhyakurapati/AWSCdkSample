import { atom } from 'jotai';
import { TargetAPIsFormVariant } from '../../types/rest-api';

export const targetAPIsFormVariantAtom = atom<TargetAPIsFormVariant | undefined>(undefined);
