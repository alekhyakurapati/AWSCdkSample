import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';

// const DDB_APPLICATIONS_TABLE_NAME = 'EAI-EventApiStack-QA-ApplicationsTable27AC2163-1GYAWEQ8XUUE5';
const DDB_APPLICATIONS_TABLE_NAME = 'EAI-EventApiStack-RP-ApplicationsTable27AC2163-1ELY6D2Y5C34F';

const data = [
    {
        ShortName: 'ART',
        Name: 'Sentient (Applied Risk Thinking)',
        CINumber: 'APM0001471',
        ContactEmail: '-',
        Owner: 'Adam Ferguson',
        CostCode: 'P0-000286-0A-4-05-003',
        OwnerRole: 'Event.User.ART',
        AwsAccounts: {
            NP: {
                Name: 'wpl-wrk-optrrma-np',
                Number: '728680636923',
            },
            PRD: {
                Name: 'wpl-wrk-optrrma-prd',
                Number: '234603566569',
            },
        },
    },
    {
        ShortName: 'HYPAUT',
        Name: 'HyperAutomation',
        CINumber: 'APM0002489',
        ContactEmail: '-',
        Owner: 'Nick Bower',
        CostCode: '-',
        OwnerRole: 'Event.User.HYPAUT',
        AwsAccounts: {
            NP: {
                Name: 'wpl-wrk-fusehypr-np',
                Number: '483321031917',
            },
            PRD: {
                Name: 'wpl-wrk-fusehypr-prd',
                Number: '776923833703',
            },
        },
    },
    {
        ShortName: 'CBM',
        Name: 'Condition Based Maintenance',
        CINumber: '-',
        ContactEmail: '-',
        Owner: '-',
        CostCode: '-',
        OwnerRole: 'Event.User.CBM',
        AwsAccounts: {
            NP: {
                Name: 'wpl-wrk-ias-np',
                Number: '933921178792',
            },
            PRD: {
                Name: 'wpl-wrk-ias-prd',
                Number: '136571999600',
            },
        },
    },
    {
        ShortName: 'IPS',
        Name: 'Identity Profile Store',
        CINumber: '-',
        ContactEmail: '-',
        Owner: '-',
        CostCode: '-',
        OwnerRole: 'Event.User.IPS',
        AwsAccounts: {
            NP: {
                Name: 'wpl-wrk-iam-np',
                Number: '019995083909',
            },
            PRD: {
                Name: 'wpl-wrk-iam-prd',
                Number: '327302869354',
            },
        },
    },
    {
        ShortName: 'ISSOW',
        Name: 'ISSOW',
        CINumber: '-',
        ContactEmail: '-',
        Owner: '-',
        CostCode: '-',
        OwnerRole: 'Event.User.ISSOW',
        AwsAccounts: {
            NP: {
                Name: 'wpl-wrk-issow-np',
                Number: '902183351303',
            },
            PRD: {
                Name: 'wpl-wrk-issow-prd',
                Number: '196238762602',
            },
        },
    },
    {
        ShortName: 'JIRA',
        Name: 'JIRA Data Center',
        CINumber: 'CI00030321',
        ContactEmail: 'jira_test@woodside.com.au',
        Owner: 'Noelene Clarke',
        CostCode: '-',
        OwnerRole: 'Event.User.JIRA',
        AwsAccounts: {
            NP: {
                Name: 'wpl-wrk-jira-np',
                Number: '221057764475',
            },
            PRD: {
                Name: 'wpl-wrk-jira-prd',
                Number: '340816250025',
            },
        },
    },
    {
        ShortName: 'PRISM',
        Name: 'PRISM (Intelligent Execution)',
        CINumber: 'APM0001112',
        ContactEmail: '-',
        Owner: 'Michael Richards',
        CostCode: 'P0-000238-0A-4-03-003',
        OwnerRole: 'Event.User.PRISM',
        AwsAccounts: {
            NP: {
                Name: 'wpl-wrk-maintplan-np',
                Number: '102227788365',
            },
            PRD: {
                Name: 'wpl-wrk-maintplan-prd',
                Number: '813380417481',
            },
        },
    },
    {
        ShortName: 'PRM',
        Name: 'PRM (Personnel Resource Management)',
        CINumber: '-',
        ContactEmail: '-',
        Owner: '-',
        CostCode: '-',
        OwnerRole: 'Event.User.PRM',
        AwsAccounts: {
            NP: {
                Name: 'wpl-wrk-prm-np',
                Number: '623958325726',
            },
            PRD: {
                Name: 'wpl-wrk-prm-np',
                Number: '393863038617',
            },
        },
    },
    {
        ShortName: 'SAP',
        Name: 'SAP PM (Cloud Platform Integration CI)',
        CINumber: 'CI00091433',
        ContactEmail: 'sap_test@woodside.com.au',
        Owner: '-',
        CostCode: '-',
        OwnerRole: 'Event.User.SAP',
        AwsAccounts: {
            NP: {
                Name: 'wpl-wrk-sap-np',
                Number: '567625158430',
            },
            PRD: {
                Name: 'wpl-wrk-sap-prd',
                Number: '783077825496',
            },
        },
    },
    {
        ShortName: 'SAR',
        Name: 'Site Access Request',
        CINumber: 'APM0001989',
        ContactEmail: '-',
        Owner: 'Kerri Aylesbury',
        CostCode: '-',
        OwnerRole: 'Event.User.SAR',
        AwsAccounts: {
            NP: {
                Name: 'wpl-wrk-sar-np',
                Number: '830160763887',
            },
            PRD: {
                Name: 'wpl-wrk-sar-prd',
                Number: '863192602173',
            },
        },
    },
    {
        ShortName: 'WILLOW',
        Name: 'Willow',
        CINumber: '-',
        ContactEmail: '-',
        Owner: '-',
        CostCode: '-',
        OwnerRole: 'l',
        AwsAccounts: {
            NP: {
                Name: 'wpl-wrk-willow-np',
                Number: '396785229772',
            },
            PRD: {
                Name: 'wpl-wrk-willow-prd',
                Number: '518804486343',
            },
        },
    },
];

// const data = Array.from({ length: 1000 }).map((v) => {
//     const shortName = faker.lorem.word().toUpperCase();
//     return {
//         PK: 'APP#' + shortName + '#' + randomUUID(),
//         CINumber: 'CI' + faker.random.numeric(7),
//         Owner: faker.name.findName(),
//         ContactEmail: faker.internet.exampleEmail(),
//         CostCode: faker.random.alphaNumeric(12),
//         CreatedBy: faker.name.findName(),
//         LastModifiedBy: faker.name.findName(),
//         LastModified: faker.date.recent().toISOString(),
//         Name: faker.lorem.words(2),
//         OwnerRole: 'Event.User.' + shortName,
//         ShortName: shortName,
//         AwsAccounts: {
//             NP: {
//                 Name: 'wpl-wrk-' + shortName.toLowerCase() + '-np',
//                 Number: faker.random.numeric(9),
//             },
//             PRD: {
//                 Name: 'wpl-wrk-' + shortName.toLowerCase() + '-prd',
//                 Number: faker.random.numeric(9),
//             },
//         },
//     };
// });

const db = DynamoDBDocument.from(new DynamoDB({ region: 'ap-southeast-2' }));

async function main() {
    await Promise.all(
        data.map((item) => {
            console.log(item.ShortName);
            return db.put({
                TableName: DDB_APPLICATIONS_TABLE_NAME,
                Item: {
                    PK: `APP#${item.ShortName}`,
                    ...item,
                },
            });
        }),
    );
    // for (const item of data) {
    //     console.log(item.ShortName);

    //     const result = await db.put({
    //         TableName: DDB_APPLICATIONS_TABLE_NAME,
    //         Item: {
    //             // PK: `APP#${item.ShortName}`,
    //             ...item,
    //         },
    //     });
    // }
}

(async () => {
    console.warn(`Running script on ${DDB_APPLICATIONS_TABLE_NAME} table`);

    const start = Date.now();
    try {
        await main();
    } catch (e) {
        // Deal with the fact the chain failed
        console.error('Main catch' + e);
    } finally {
        const end = Date.now();
        console.log('Start time: ' + new Date(start).toISOString());
        console.log('End time  : ' + new Date(end).toISOString());
        console.log('Time (s)  : ' + (end - start) / 1000);
    }
})();
