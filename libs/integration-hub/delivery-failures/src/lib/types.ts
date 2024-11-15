import { PrimitiveAtom } from 'jotai';

export interface FilterOption {
    title: string;
    options: string[];
    atom: PrimitiveAtom<string | undefined>;
    value: string;
    removeClearFilterOption?: boolean;
}
