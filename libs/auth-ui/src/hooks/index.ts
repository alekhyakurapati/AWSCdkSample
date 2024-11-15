import { useMsal } from '@azure/msal-react';
import { useAtomValue } from 'jotai';
import { envAtom } from '../atoms';

export const useAuthenticatedFetch = () => {
    const { instance } = useMsal();
    const env = useAtomValue(envAtom);

    return async (url: string, options?: RequestInit) => {
        const token = await instance.acquireTokenSilent({
            scopes: env.auth.request.scopes,
            redirectUri: env.auth.redirectUri,
        });

        const result = await fetch(`${env.baseApiUrl}${url}`, {
            ...options,
            headers: { ...options?.headers, Authorization: `Bearer ${token?.idToken ?? ''}` },
        });

        if (result.statusText === 'No Content') return {};
        if (!result.ok) {
            const text = await result.text();
            const error = JSON.parse(text);
            const message = Array.isArray(error.message) ? error.message.join('\t') : error.message;
            throw new Error(message);
        }

        return await result.json();
    };
};
