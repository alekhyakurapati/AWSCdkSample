import { AuthenticationResult, EventMessage, EventType, PublicClientApplication } from '@azure/msal-browser';

import { config } from './config';
import { AuthEnvConfig } from '../types';

const MSALClient = (auth: AuthEnvConfig) => {
    const msalConfig = config(auth);
    const msalInstance = new PublicClientApplication(msalConfig);

    // Default to using the first account if no account is active on page load
    if (!msalInstance.getActiveAccount() && msalInstance.getAllAccounts().length > 0) {
        // Account selection logic is app dependent. Adjust as needed for different use cases.
        msalInstance.setActiveAccount(msalInstance.getAllAccounts()[0]);
    }

    // This will update account state if a user signs in from another tab or window
    // And since SSO is used, if a user signs out of an different app in another tab, sign them out here as well
    msalInstance.enableAccountStorageEvents();

    msalInstance.addEventCallback((event: EventMessage) => {
        if (process.env.NODE_ENV === 'development') {
            console.log('msalInstance.addEventCallback: ', event);
        }

        if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
            const payload = event.payload as AuthenticationResult;
            const account = payload.account;
            msalInstance.setActiveAccount(account);
        }
    });

    return msalInstance;
};

export default MSALClient;
