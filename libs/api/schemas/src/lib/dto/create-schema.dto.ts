import { IsNotEmpty, IsOptional, Matches, MaxLength } from 'class-validator';
import { IsValidWoodsideSchema } from '../validators/is-woodside-schema';
import { SchemaSummary } from '@eai-event-integration-platform/interfaces';

export class CreateSchemaDto implements SchemaSummary {
    @IsValidWoodsideSchema()
    Content: string;

    @IsNotEmpty()
    @MaxLength(385)
    @Matches(/^[a-zA-Z0-9_.\-@]+$/, {
        message: 'SchemaName must contain characters consisting of lower case letters, upper case letters, ., -, _, @.',
    })
    @IsNotEmpty()
    SchemaName: string;

    @IsNotEmpty()
    Description: string;

    @IsOptional()
    SchemaOwner: string;

    @IsOptional()
    SchemaSupportGroup: string;

    @IsNotEmpty()
    EventClassification: 'internal' | 'confidential' | 'most confidential';

    @IsOptional()
    CostCode: string;

    @IsNotEmpty()
    AppName: string;

    @IsNotEmpty()
    AppCINumber: string;

    @IsNotEmpty()
    OwnerRole: string;

    @IsNotEmpty()
    Domain: string;
}
