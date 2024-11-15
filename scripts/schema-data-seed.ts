import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { Schemas } from '@aws-sdk/client-schemas';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { faker } from '@faker-js/faker';
import { capitalize } from 'lodash';
import { CreateSchemaDto } from '../libs/api/schemas/src';
import { SchemaDetails, SchemaSummary, SchemaVersionState, Version } from '../libs/interfaces/src';

// const SCHEMA_REGISTRY_NAME = 'EAI-SchemaRegistry-RP';
// const DDB_SCHEMA_TABLE_NAME = 'EAI-EventApiStack-RP-SchemasTable1DC069C3-8DE0AZ3UHTUS';
// const SCHEMA_REGISTRY_NAME = 'EAI-SchemaRegistry-AS';
// const DDB_SCHEMA_TABLE_NAME = 'EAI-EventApiStack-AS-SchemasTable1DC069C3-1UQ0NVSEB8MZJ';
const SCHEMA_REGISTRY_NAME = 'EAI-SchemaRegistry-DEV';
const DDB_SCHEMA_TABLE_NAME = 'EAI-EventApiStack-DEV-SchemasTable1DC069C3-1U951BW2YKRFI';

const client = new Schemas({ region: 'ap-southeast-2' });
const db = DynamoDBDocument.from(new DynamoDB({ region: 'ap-southeast-2' }));

const schemaNames = [
    ['SAP', 'wel.finance-commercial.finance@QuarterlyReportGenerated'],
    ['SAR', 'wel.human-resource-management.human-resources@UserCreated'],
    // 'wel.human-resource-management.human-resources@UserOnboarded',
    ['IPS', 'wel.human-resource-management.human-resources@UserPositionChanged'],
    // 'wel.digital.integration@EventSchemaCreated',
    // 'wel.digital.integration@EventSchemaUpdated',
    // 'wel.digital.integration@EventSchemaDeleted',
    // 'wel.digital.integration@EventSubscriptionCreated',
    // 'wel.digital.integration@EventSubscriptionUpdated',
    // 'wel.digital.integration@EventSubscriptionDeleted',
    // 'wel.digital.science@SignificantEvent',
    ['SAP', 'wel.operations.logistics@OrderCreated'],
    ['FUSE', 'wel.operations.production.operations@TankPressureHigh'],
    // 'wel.operations.hse.moc@Issue',
    // 'wel.operations.hse.moc@Issuelink',
    // 'wel.operations.hse.moc@IssueStatusChange',
    // 'wel.operations.hse.oper@Issue',
    // 'wel.operations.hse.oper@Issuelink',
    // 'wel.operations.hse.oper@IssueStatusChange',
    ['SAP', 'wel.operations.maintenance@WorkOrderStatusChange'],
    ['SAP', 'wel.operations.maintenance@WorkOrderChanged'],
];

const schemaContent = {
    $schema: 'http://json-schema.org/draft-04/schema',
    id: 'http://example.com/example.json',
    // definitions: {
    //     WoodsideEvent: {
    //         type: 'object',
    //         properties: {
    //             Metadata: {
    //                 type: 'object',
    //                 properties: {
    //                     Guid: { type: 'string' },
    //                     Time: { type: 'integer' },
    //                     Version: { type: 'string' },
    //                 },
    //             },
    //             Data: {
    //                 $ref: '#/definitions/<<EventNamePlaceholder>>',
    //             },
    //         },
    //     },
    //     '<<EventNamePlaceholder>>': {
    //         type: 'object',
    //         properties: {
    //             Checked: { type: 'boolean' },
    //             Dimensions: {
    //                 type: 'object',
    //                 properties: {
    //                     Width: { type: 'number' },
    //                     Height: { type: 'number' },
    //                 },
    //             },
    //             Id: { type: 'number' },
    //             Name: { type: 'string' },
    //             Price: { type: 'number' },
    //             Tags: {
    //                 type: 'array',
    //                 items: { type: 'string' },
    //             },
    //         },
    //     },
    // },
    type: 'object',
    properties: {
        version: { type: 'string' },
        id: { type: 'string' },
        'detail-type': { type: 'string' },
        source: { type: 'string' },
        account: { type: 'string' },
        time: { type: 'string' },
        region: { type: 'string' },
        resources: { type: 'array' },
        detail: {
            type: 'object',
            properties: {
                Metadata: {
                    type: 'object',
                    properties: {
                        Guid: { type: 'string' },
                        Time: { type: 'integer' },
                        Version: { type: 'string' },
                    },
                },
                Data: {
                    type: 'object',
                    properties: {
                        Checked: { type: 'boolean' },
                        Dimensions: {
                            type: 'object',
                            properties: {
                                Width: { type: 'number' },
                                Height: { type: 'number' },
                            },
                        },
                        Id: { type: 'number' },
                        Name: { type: 'string' },
                        Price: { type: 'number' },
                        Tags: {
                            type: 'array',
                            items: { type: 'string' },
                        },
                    },
                },
            },
        },
    },
    examples: [
        {
            version: '0',
            id: '397fd77e-b830-cbdf-111b-05c276896c1b',
            'detail-type': '',
            source: '',
            account: '727026770742',
            time: '2022-03-21T01:30:52Z',
            region: 'ap-southeast-2',
            resources: [],
            detail: {
                Metadata: {
                    Guid: '50347fea-87a9-4a68-98d6-75f325769c05',
                    Time: 1647826252069,
                    Version: '1',
                },
                Data: {
                    Checked: false,
                    Dimensions: {
                        Width: 5,
                        Height: 10,
                    },
                    Id: 1,
                    Name: 'A green door',
                    Price: 12.5,
                    Tags: ['home', 'green'],
                },
            },
        },
    ],
};

const results = {
    success: <string[]>[],
    failed: <string[]>[],
};

function generateSchema(appName: string, name: string) {
    const desc = faker.lorem.paragraph().substring(0, 255);
    // const appName = faker.helpers.arrayElement(['SAP', 'JIRA', 'FUSE', 'SAR']);
    const classification = faker.helpers.arrayElement(['internal', 'confidential', 'most confidential']);
    const ownerRole = 'Event.User.' + appName;
    const [domain, eventName] = name.split('@');
    const state = faker.helpers.arrayElement([SchemaVersionState.DRFT, SchemaVersionState.PUBL]) as SchemaVersionState;

    schemaContent.examples[0].source = domain;
    schemaContent.examples[0]['detail-type'] = eventName;

    const schemaData: SchemaDetails = {
        Content: JSON.stringify(schemaContent, null, 2),
        SchemaName: name,
        Description: desc,
        SchemaOwner: faker.internet.email(),
        SchemaSupportGroup: 'Integration',
        EventClassification: classification,
        CostCode: '123456',
        AppName: appName,
        AppCINumber: '500',
        OwnerRole: ownerRole,
        CreatedBy: 'Test, User <user.test@woodside.com.au>',
        LastUpdated: new Date().toISOString(),
        LastUpdatedBy: 'Test, User <user.test@woodside.com.au>',
        Domain: domain,
        State: state,
        VersionCount: 1,
        AvailableVersions: { '1': state },
        Version: '1',
    };
    // console.log('schema', schema);
    return schemaData;
}

async function saveSchema(appName: string, schemaName: string) {
    console.log('Saving new schema for: ', schemaName);
    try {
        await client.deleteSchema({ RegistryName: SCHEMA_REGISTRY_NAME, SchemaName: schemaName });
    } catch (error) {
        if (error.Code && error.Code !== 'ResourceNotFound') {
            console.error('Error deleting schema for: ' + schemaName, error.message);
        }
    }
    const schema = generateSchema(appName, schemaName);
    try {
        const { $metadata, ...schemaResult } = await client.createSchema({
            Content: schema.Content,
            RegistryName: SCHEMA_REGISTRY_NAME,
            SchemaName: schema.SchemaName,
            Type: 'JSONSchemaDraft4',
            Description: schema.Description,
        });

        const schemaSummary: SchemaSummary = {
            SchemaName: schemaResult.SchemaName,
            SchemaArn: schemaResult.SchemaArn,
            Description: schemaResult.Description,
            SchemaType: schemaResult.Type,

            EventClassification: schema.EventClassification,
            AppName: schema.AppName,
            AppCINumber: schema.AppCINumber,
            Domain: schema.Domain,
            CostCode: schema.CostCode,
            SchemaOwner: schema.SchemaOwner,
            SchemaSupportGroup: schema.SchemaSupportGroup,
            OwnerRole: schema.OwnerRole,

            VersionCount: 1,
            AvailableVersions: schema.AvailableVersions,

            CreatedBy: schema.CreatedBy,
            LastUpdated: schema.LastUpdated,
            LastUpdatedBy: schema.LastUpdatedBy,
        };

        await db.put({
            TableName: DDB_SCHEMA_TABLE_NAME,
            Item: {
                PK: `SCH#${schemaName}`,
                SK: `SCH#${schemaName}`,
                Type: 'Schema',
                ...schemaSummary,
            },
        });

        const version: Version = {
            Content: schema.Content,
            AWSVersion: schemaResult.SchemaVersion!,
            State: schema.State as SchemaVersionState,
            Version: schemaResult.SchemaVersion!,
            VersionCreatedDate: schemaResult.VersionCreatedDate?.toISOString(),
            CreatedBy: schema.CreatedBy,
            LastUpdated: schema.LastUpdated,
            LastUpdatedBy: schema.LastUpdatedBy,
        };

        await db.put({
            TableName: DDB_SCHEMA_TABLE_NAME,
            Item: {
                PK: `SCH#${schemaName}`,
                SK: `VER#1`,
                Type: 'Version',
                ...version,
            },
        });

        results.success.push(schemaName);
    } catch (error) {
        console.error('Error creating schema for: ' + schemaName, error, schema);
        results.failed.push(schemaName);
    }
}

(async () => {
    console.warn(`Running script on ${SCHEMA_REGISTRY_NAME} schema registry`);
    try {
        for (const [app, name] of schemaNames) {
            await saveSchema(app, name);
        }
    } catch (e) {
        // Deal with the fact the chain failed
    }
    console.log('Results: ', results);
})();

// schemaNames.forEach(async (name) => saveSchema(name));

// Promise.all(promises)
//   .then((result) => console.log('result', result))
//   .catch((err) => console.error(err));
