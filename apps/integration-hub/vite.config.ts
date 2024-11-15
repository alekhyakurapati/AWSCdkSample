/// <reference types="vitest" />
import { replaceFiles } from '@nx/vite/plugins/rollup-replace-files.plugin';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

export default defineConfig({
    root: __dirname,
    build: {
        outDir: '../../dist/apps/integration-hub',
        reportCompressedSize: true,
        commonjsOptions: {
            transformMixedEsModules: true,
        },
    },
    cacheDir: '../../node_modules/.vite/integration-hub',

    server: {
        port: 4200,
        host: 'localhost',
    },

    preview: {
        port: 4300,
        host: 'localhost',
    },

    plugins: [
        // replaceFiles([
        //     {
        //         replace: 'apps/integration-hub/src/environments/environment.ts',
        //         with: 'apps/integration-hub/src/environments/environment.dev.ts',
        //     },
        // ]),
        react(),
        nxViteTsPaths(),
    ],

    // Uncomment this if you are using workers.
    // worker: {
    //  plugins: [
    //    viteTsConfigPaths({
    //      root: '../../',
    //    }),
    //  ],
    // },

    test: {
        reporters: ['default'],
        coverage: {
            reportsDirectory: '../../coverage/apps/integration-hub',
            provider: 'v8',
        },
        globals: true,
        cache: {
            dir: '../../node_modules/.vitest',
        },
        environment: 'jsdom',
        include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    },
});
