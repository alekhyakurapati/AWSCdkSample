import { IsNotEmpty } from 'class-validator';

export class DeletePermissionDto {
    @IsNotEmpty()
    statementidPrd: string;

    @IsNotEmpty()
    statementidNp: string;
}
