import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length } from 'class-validator';

export class CreateRoleDto {
    @ApiProperty({ example: 'ADMIN', description: 'Значение роли' })
    @IsString()
    @Length(1, 50)
    readonly value: string;

    @ApiProperty({ example: 'Администратор системы', description: 'Описание роли' })
    @IsString()
    @Length(1, 255)
    readonly description: string;
}