import { IsNotEmpty, Matches, MaxLength } from 'class-validator';
import { IsValidWoodsideSchema } from '../validators/is-woodside-schema';
import { SchemaSummary } from '@eai-event-integration-platform/interfaces';

export class UpdateSchemaDto implements SchemaSummary {
    @IsValidWoodsideSchema()
    Content: string;

    @IsNotEmpty()
    @MaxLength(385)
    @Matches(/^[a-zA-Z0-9_.\-@]+$/, {
        message: 'SchemaName must contain characters consisting of lower case letters, upper case letters, ., -, _, @.',
    })
    SchemaName: string;

    @IsNotEmpty()
    CostCode: string;

    @IsNotEmpty()
    SchemaOwner: string;

    @IsNotEmpty()
    SchemaSupportGroup: string;

    @IsNotEmpty()
    EventClassification: 'internal' | 'confidential' | 'most confidential';

    @IsNotEmpty()
    AppCINumber: string;

    @IsNotEmpty()
    OwnerRole: string;

    @IsNotEmpty()
    AppName: string;

    @IsNotEmpty()
    Description: string;
}
