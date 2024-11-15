import { InteractionType } from '@azure/msal-browser';
import { AuthenticatedTemplate, MsalProvider, useAccount, useMsalAuthentication } from '@azure/msal-react';
import { useAtomValue, useSetAtom } from 'jotai';
import React, { useEffect } from 'react';
import { authAtom, envAtom } from '../atoms';
import MSALClient from './client';
import { WebappEnvironment } from '../types';

type AuthConsumerProps = {
    children: React.ReactNode;
};

const AuthConsumer = ({ children }: AuthConsumerProps) => {
    const env = useAtomValue(envAtom);
    useMsalAuthentication(InteractionType.Redirect, {
        scopes: env.auth.request.scopes,
    });
    const userInfo = useAccount();
    const setAuth = useSetAtom(authAtom);

    useEffect(() => {
        if (userInfo) {
            const roles = userInfo.idTokenClaims?.roles ?? [];

            const userRoles = roles.filter((role) => role.startsWith('Event.User'));

            const isUser = userRoles.length > 0;
            const isAdmin = roles.includes('Event.Admin');

            setAuth({ isUser, isAdmin, userRoles });
        }
    }, [userInfo, setAuth]);

    return <AuthenticatedTemplate>{children}</AuthenticatedTemplate>;
};

type AuthProviderProps = {
    environment: WebappEnvironment;
    children: React.ReactNode;
};

export const AuthProvider = ({ environment, children }: AuthProviderProps) => {
    const { auth } = environment;
    const msalInstance = MSALClient(auth);

    const setEnv = useSetAtom(envAtom);
    setEnv(environment);

    return (
        <MsalProvider instance={msalInstance}>
            <AuthConsumer>{children}</AuthConsumer>
        </MsalProvider>
    );
};
