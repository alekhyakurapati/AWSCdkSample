export interface DynamoDBConfig {
    autoScaling: AutoScaling;
    pointInTimeRecovery: boolean;
}

export interface AutoScaling {
    readCapacity: ReadCapacity;
    writeCapacity: WriteCapacity;
    targetUtilisationPercent: number;
}

export interface ReadCapacity {
    min: number;
    max: number;
}

export interface WriteCapacity {
    min: number;
    max: number;
}

export interface EaiPlatformContext {
    internalApiUrl: string;
    internalApiUrlNp: string;
    externalApiUrl: string;
    externalApiUrlNp: string;
    applicationsTableName: string;
    assumeNpRoleArn: string;
    customerClientId: string;
    customerClientIdNp: string;
    ddbTableConfig: DynamoDBConfig;
    eventFailuresTableNamePRD: string;
    eventBusArn: string;
    eventFailuresTableNameNP: string;
    eventBusArnNp: string;
    eventEmailLambdaRoleArnNp: string;
    ddbTableReadRoleProdArn: string;
    eventBucketName: string;
    eventBucketNameNp: string;
    eventDlqArn: string;
    eventDlqArnNp: string;
    invokeApiDestRoleArn: string;
    invokeApiDestRoleArnNp: string;
    putEventBusDestRoleArn: string;
    putEventBusDestRoleArnNp: string;
    nodeEnv: string;
    portalClientId: string;
    schemasTableName: string;
    sesRole: string;
    subscriptionsTableName: string;
}
