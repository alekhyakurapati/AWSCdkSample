import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { CfnRegistry } from 'aws-cdk-lib/aws-eventschemas';
import { Construct } from 'constructs';
import { generateResourceName } from '../utils';

export class SchemaRegistryStack extends Stack {
    schemaRegistry: CfnRegistry;

    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);

        this.schemaRegistry = new CfnRegistry(this, `SchemaRegistry`, {
            description: 'Schema registry for the Integration Platform',
            registryName: generateResourceName('SchemaRegistry'),
        });

        new CfnOutput(this, 'EAISchemaRegistryName', { value: this.schemaRegistry.registryName });
    }
}
