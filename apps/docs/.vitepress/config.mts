import { defineConfig } from 'vitepress';

export default defineConfig({
    lang: 'en-US',
    title: 'IntegrationHub',
    description: 'IntegrationHub Documentation',
    lastUpdated: true,

    cleanUrls: false,
    base: '/docs/',
    srcDir: './src',
    outDir: '../../dist/apps/docs',
    cacheDir: '../../.vitepress/cache',

    themeConfig: {
        search: {
            provider: 'local',
        },
        logo: '/ihub-logo.svg',
        nav: [
            { text: 'Events User Guide', link: '/events/introduction', activeMatch: '^/$|^/events/' },
            // { text: 'API User Guide', link: '/apis/introduction', activeMatch: '^/$|^/apis/' },
        ],

        socialLinks: [{ icon: 'github', link: 'https://github.com/Woodside/eai-event-integration-platform' }],

        sidebar: {
            '/events/': getEventsSidebar(),
            '/apis/': getApisSidebar(),
        },

        footer: {
            message: 'Integration Platform',
            copyright: 'Copyright © 2018-present',
        },
        editLink: {
            pattern: 'https://github.com/woodside/eai-integration-platform/edit/main/docs/:path',
        },
        lastUpdatedText: 'Last Updated',
    },
});

function getEventsSidebar() {
    return [
        {
            text: 'EDA @ Woodside',
            collapsed: false,
            link: '/events/introduction',
            items: [
                { text: 'Shared Responsibility Model', link: '/events/shared-responsibility' },
                { text: 'EDA User Journey', link: '/events/eda-user-journey' },
            ],
        },
        {
            text: 'Getting Started',
            collapsed: false,
            link: '/events/getting-started/getting-started',
            items: [
                { text: 'Application Onboarding', link: '/events/getting-started/application-onboarding' },
                { text: 'Requesting Access', link: '/events/getting-started/requesting-access' },
            ],
        },
        {
            text: 'For Producers',
            collapsed: true,
            link: '/events/for-producers/producer-applications',
            items: [
                { text: 'Producer User Journey', link: '/events/for-producers/producer-journey' },
                { text: 'Event Message Patterns', link: '/events/for-producers/event-message-patterns' },
                { text: 'Naming your Event', link: '/events/for-producers/naming-events' },
                { text: 'Structuring your Event', link: '/events/for-producers/structuring-events' },
                {
                    text: 'Publishing Events',
                    link: '/events/for-producers/publishing-events',
                    collapsed: true,
                    items: [
                        { text: 'via AWS SDK', link: '/events/for-producers/publishing-via-sdk' },
                        { text: 'via REST API', link: '/events/for-producers/publishing-via-api' },
                    ],
                },
            ],
        },
        {
            text: 'For Consumers',
            collapsed: true,
            link: '/events/for-consumers/consumer-applications',
            items: [
                { text: 'Consumer User Journey', link: '/events/for-consumers/consumer-journey' },
                {
                    text: 'Subscribing to Events',
                    link: '/events/for-consumers/subscribing-events',
                    collapsed: true,
                    items: [
                        { text: 'via AWS EventBridge', link: '/events/for-consumers/subscribing-via-bus' },
                        { text: 'via REST API', link: '/events/for-consumers/subscribing-via-api' },
                    ],
                },
                { text: 'Fetching Large Payloads', link: '/events/for-consumers/fetching-large-payloads' },
                { text: 'Failures and Retries', link: '/events/for-consumers/event-delivery-retry' },
            ],
        },

        // { text: 'Using Event Filters', link: '/events/for-consumers/event-filters' },
        // {
        //     text: 'Integration Hub User Guide',
        //     collapsed: false,
        //     items: [
        //         { text: 'Overview', link: '/events/hub-user-guide/overview' },
        //         {
        //             text: 'Schema Catalog',
        //             collapsed: false,
        //             items: [
        //                 { text: 'Browsing Schemas', link: '/events/hub-user-guide/schema-catalog/browsing' },
        //                 {
        //                     text: 'Filtering and Sorting',
        //                     link: '/events/hub-user-guide/schema-catalog/filtering-sorting',
        //                 },
        //                 { text: 'Viewing Details', link: '/events/hub-user-guide/schema-catalog/view-details' },
        //                 { text: 'Creating New Schemas', link: '/events/hub-user-guide/schema-catalog/creating' },
        //                 { text: 'Updating Schemas', link: '/events/hub-user-guide/schema-catalog/updating' },
        //                 { text: 'Publishing Schemas', link: '/events/todo' },
        //             ],
        //         },
        //         {
        //             text: 'Subscriptions',
        //             collapsed: true,
        //             items: [
        //                 { text: 'Subscribing to Events', link: '/events/todo' },
        //                 { text: 'Managing Subscriptions', link: '/events/todo' },
        //             ],
        //         },
        //         {
        //             text: 'API Targets',
        //             collapsed: true,
        //             items: [
        //                 { text: 'Creating API Targets', link: '/events/todo' },
        //                 { text: 'Managing API Targets', link: '/events/todo' },
        //             ],
        //         },
        //         {
        //             text: 'Event Delivery Failures',
        //             collapsed: true,
        //             items: [
        //                 { text: 'Viewing Event Delivery Failures', link: '/events/todo' },
        //                 { text: 'Replaying Events', link: '/events/todo' },
        //             ],
        //         },
        //     ],
        // },
    ];
}

function getApisSidebar() {
    return [
        {
            text: 'APIs',
        },
    ];
}
