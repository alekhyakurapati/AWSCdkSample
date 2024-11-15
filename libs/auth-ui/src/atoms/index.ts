import { atom } from 'jotai';
import { WebappEnvironment } from '../types';

export const authAtom = atom({ isUser: false, isAdmin: false, userRoles: [] as string[] });
export const envAtom = atom({} as WebappEnvironment);
