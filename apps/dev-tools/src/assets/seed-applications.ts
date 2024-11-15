import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import promptly from 'promptly';
import { apps } from './apps';

const ddbDoc = DynamoDBDocument.from(new DynamoDB({ region: 'ap-southeast-2' }));

const defaultAppsTable = 'DDB_APPLICATIONS_TABLE_NAME=EAI-EventApiStack-DEV-ApplicationsTable27AC2163-12DYC8XX6DEPE';

export const seedApplications = async () => {
    console.log('Seeding applications table');

    if (!(await promptly.confirm('Are you signed in to the correct AWS workload?'))) return;

    const appsTable = await promptly.prompt(`Which table to populate? (${defaultAppsTable})`, {
        default: defaultAppsTable,
    });

    const results = await Promise.allSettled(
        apps.map((item) => {
            return ddbDoc.put({
                TableName: appsTable,
                Item: item,
            });
        }),
    );

    const errors = results.filter((result) => result.status === 'rejected');

    if (errors.length > 0) {
        results.forEach((result) => console.log(result));
    } else {
        console.log('Successfully populated applications table');
    }
};
