import { DynamoDB, ScanCommandInput } from '@aws-sdk/client-dynamodb';
import { DescribeSchemaCommandInput, Schemas } from '@aws-sdk/client-schemas';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { AvailableVersions, SchemaDetails, SchemaSummary, Version } from '../../libs/interfaces/src';
import { VersionMapping } from '../../libs/utils/src/lib/version-mapping';

const REGISTRY_NAME = 'EAI-SchemaRegistry-PRD';
const schemaClient = new Schemas({ region: 'ap-southeast-2' });
const ddbDoc = DynamoDBDocument.from(new DynamoDB({ region: 'ap-southeast-2' }));

const DDB_SCHEMAS_TABLE_NAME = 'EAI-EventApiStack-PRD-SchemasTable1DC069C3-SUCRESQE1YCB';
const DDB_APPLICATIONS_TABLE_NAME = 'EAI-EventApiStack-PRD-ApplicationsTable27AC2163-1QY3LP63MV5F9';

/**
 * To migrate current schemas from a Schema Registry to Dynamo DB
 */
async function main() {
    // get a list of schemas from registry
    const result = await schemaClient.listSchemas({ RegistryName: REGISTRY_NAME });
    const schemas = result.Schemas!;
    // const xschemas = schemas.slice(0, 2);

    // get application data from applications
    const applicationData = await getDynamoData(DDB_APPLICATIONS_TABLE_NAME);

    for (const s of schemas) {
        // get schema data for content
        const describeParams: DescribeSchemaCommandInput = {
            RegistryName: REGISTRY_NAME,
            SchemaName: s.SchemaName,
        };
        const schemaData = await schemaClient.describeSchema(describeParams);

        const versionNumberMap = VersionMapping.parse(schemaData.Tags?.sysVersionMap);
        const versionStateMap = VersionMapping.parse(schemaData.Tags?.sysVersionState);

        // Create schema detail entry input in dynamo db
        const ddbCreateSchemaDetail: SchemaDetails = {
            SchemaName: s.SchemaName,
            SchemaArn: s.SchemaArn,
            Description: schemaData.Description,
            SchemaType: schemaData.Type,
            EventClassification: schemaData.Tags?.EventClassification,
            AppName: schemaData.Tags?.sysService,
            AppCINumber: getCINumber(applicationData, schemaData.Tags?.sysService),
            Domain: schemaData.Tags?.sysDomain,
            CostCode: schemaData.Tags?.CostCode === '' ? schemaData.Tags?.CostCode : 'undefined',
            SchemaOwner: schemaData.Tags?.SchemaOwner === '' ? schemaData.Tags?.SchemaOwner : 'undefined',
            SchemaSupportGroup: schemaData.Tags?.SchemaSupportGroup,
            OwnerRole: schemaData.Tags?.OwnerRole,
            VersionCount: getLatestVersion(versionStateMap),
            AvailableVersions: versionStateMap as AvailableVersions,
            CreatedBy: convertName(schemaData.Tags?.sysCreatedBy),
            LastUpdatedBy: convertName(schemaData.Tags?.sysLastUpdatedBy),
            LastUpdated: schemaData.LastModified?.toISOString(),
        };

        // remove undefined
        for (let k in ddbCreateSchemaDetail) {
            if (ddbCreateSchemaDetail[k as keyof SchemaDetails] === undefined)
                delete ddbCreateSchemaDetail[k as keyof SchemaDetails];
        }
        await createDynamoEntry(ddbCreateSchemaDetail, `SCH#${s.SchemaName}`, s.SchemaName as string, 'Schema');

        // Create version entry in dynamo db
        for (const version in versionStateMap) {
            const latestAWSVersion = String(getLatestAwsVersion(versionNumberMap, version));
            const versionState = getState(versionStateMap, (parseInt(version) + 1).toString());
            const describeVersionSchemaParams: DescribeSchemaCommandInput = {
                RegistryName: REGISTRY_NAME,
                SchemaName: s.SchemaName,
                SchemaVersion: latestAWSVersion,
            };
            const schemaVersionData = await schemaClient.describeSchema(describeVersionSchemaParams);

            const ddbCreateSchemaVersion: Version = {
                AWSVersion: (parseInt(versionNumberMap[version]) + 1).toString(),
                Content: schemaVersionData.Content,
                CreatedBy: convertName(schemaData.Tags?.sysCreatedBy),
                LastUpdatedBy: convertName(schemaData.Tags?.sysLastUpdatedBy),
                LastUpdated: schemaVersionData.LastModified?.toISOString(),
                State: versionState,
                Version: (parseInt(version) + 1).toString(),
                VersionCreatedDate: String(schemaVersionData.VersionCreatedDate),
            };

            for (let k in ddbCreateSchemaVersion) {
                if (ddbCreateSchemaVersion[k as keyof Version] === undefined)
                    delete ddbCreateSchemaVersion[k as keyof Version];
            }
            await createDynamoEntry(ddbCreateSchemaVersion, `VER#${version}`, s.SchemaName as string, 'Version');
        }
    }
}

async function createDynamoEntry(data: SchemaSummary, SK: string, schemaName: string, type: string) {
    try {
        await ddbDoc.put({
            TableName: DDB_SCHEMAS_TABLE_NAME,
            Item: {
                PK: `SCH#${schemaName}`,
                SK: SK,
                Type: type,
                ...data,
            },
        });
    } catch (error) {
        console.error('what was the input', data);
        console.error('DynamoDB error: ', error);
    }
}

/**
 * Get all Dynamo db data by scanning
 */
async function getDynamoData(tableName: string) {
    try {
        const query: ScanCommandInput = {
            TableName: tableName,
        };

        const result = await ddbDoc.scan(query);
        const { $metadata, ...data } = result;
        return data.Items;
    } catch (error) {
        console.error('DynamoDB error: ', error);
    }
}

/**
 * Returns the latest AWS version equivalent of the platform version from the provided versionMap string
 */
function getLatestVersion(versionMap: VersionMapping) {
    return Object.entries(versionMap).reduce((max, [version, state]) => {
        // return only the latest awsVersion
        if (+version > max) {
            max = +version;
        }
        return max;
    }, 0);
}

/**
 * Get CINumber based on array of application data and applicationName
 */

function getCINumber(applicationList: Record<string, any>[] | undefined, applicationName: string | undefined) {
    if (applicationList && applicationName) {
        const appData = applicationList.filter((application) => application.ShortName === applicationName);
        if (appData.length != 0) {
            return appData[0]['CINumber'];
        } else {
            return '-';
        }
    } else {
        return '-';
    }
}

/**
 * Converts name from name:email to name <email>
 */

function convertName(name: string | undefined): string | undefined {
    if (!name) {
        return '';
    }
    const nameRegex = new RegExp(/^^(?<FirstName>[A-Za-z]+)\s(?<LastName>[A-Za-z]+):(?<email>[A-Za-z.@]+)/, 'g');
    const regexResult = nameRegex.exec(name);
    if (!regexResult || !regexResult.groups) {
        return name;
    } else {
        return `${regexResult!.groups?.LastName}, ${regexResult!.groups?.FirstName} <${regexResult!.groups?.email}>`;
    }
}

/**
 * Returns the latest AWS version equivalent of the platform version from the provided versionMap string
 */
function getLatestAwsVersion(versionMap: VersionMapping, version: string) {
    return Object.entries(versionMap)
        .filter(([awsVer, platVer]) => {
            // filter out all the possible awsVersions
            return +platVer === +version;
        })
        .reduce((max, [awsVer, platVer]) => {
            // return only the latest awsVersion
            if (+awsVer > max) {
                max = +awsVer;
            }
            return max;
        }, 0);
}

function getState(versionMap: VersionMapping, version: string) {
    const versionState = Object.entries(versionMap).filter(([ver, state]) => {
        return (parseInt(ver) + 1).toString() == version;
    });
    return versionState[0][1];
}

(async () => {
    try {
        await main();
    } catch (error) {
        console.error(error);
    } finally {
        console.log('finished');
    }
})();
