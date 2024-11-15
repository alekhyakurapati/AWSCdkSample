import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { createTheme, CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { typography, woodsideBluePalette } from '@woodside/mui-themes';
import { SnackbarProvider } from 'notistack';
import { lazy, StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './app/app';
import { environment } from './environments/environment';

const AuthProvider = lazy(() => import('@eai-event-integration-platform/auth-ui'));

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            staleTime: 5 * 60 * 1000, // 5 minutes
        },
    },
});

const theme = createTheme({
    palette: woodsideBluePalette,
    typography: { ...typography, fontSize: 14 },
    components: {
        MuiFormHelperText: {
            styleOverrides: {
                root: {
                    '&.Mui-error': {
                        color: `${woodsideBluePalette.error.contrastText} !important`,
                    },
                },
            },
        },
        MuiInput: {
            styleOverrides: {
                underline: {
                    '&.Mui-error:after': {
                        borderBottomColor: `${woodsideBluePalette.error.contrastText} !important`,
                    },
                    '&.Mui-error:before': {
                        borderBottomColor: `${woodsideBluePalette.error.contrastText} !important`,
                    },
                },
            },
        },
    },
});

// TODO: fix CSF compliance
// // UUIDv4 value to be used as a nonce https://mui.com/material-ui/guides/content-security-policy/#server-side-rendering-ssr
// // Must match value in the ./ci/app.config.json file for styles to work
// // Read more at https://developer.app.woodside/reference/products/web-application/application-config.html
// const cache = createCache({
//     key: 'eai',
//     nonce: environment.csp.styleNonce,
//     prepend: true,
// });

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
    <StrictMode>
        <AuthProvider environment={environment}>
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    {/* <CacheProvider value={cache}> */}
                    <CssBaseline />
                    <ThemeProvider theme={theme}>
                        <SnackbarProvider variant="info" />
                        <App />
                    </ThemeProvider>
                    {/* </CacheProvider> */}
                </BrowserRouter>
                <ReactQueryDevtools />
            </QueryClientProvider>
        </AuthProvider>
    </StrictMode>,
);
