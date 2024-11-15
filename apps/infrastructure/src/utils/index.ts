import { App } from 'aws-cdk-lib';
import { EaiPlatformContext } from './interfaces';

export const getEnvVars = () => {
    return {
        ACCOUNT: process.env.CDK_DEPLOY_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
        REGION: process.env.CDK_DEPLOY_REGION || process.env.CDK_DEFAULT_REGION,
        CDK_STAGE: process.env.CDK_STAGE || 'DEV',
        PROJECT_CODE: process.env.PROJECT_CODE || 'EAI',
    };
};

export const generateResourceName = (baseName: string, suffix?: string): string => {
    const { PROJECT_CODE, CDK_STAGE } = getEnvVars();
    return `${PROJECT_CODE ?? ''}-${baseName}-${CDK_STAGE.toUpperCase() ?? ''}-${suffix ?? ''}`
        .replace(/-{2,}/g, '-')
        .replace(/^-/, '')
        .replace(/-$/, '');
};

export const getContext = (app: App): EaiPlatformContext => {
    const cdkStage = app.node.tryGetContext('stage') || 'DEV';
    return app.node.tryGetContext(cdkStage) as EaiPlatformContext;
};
