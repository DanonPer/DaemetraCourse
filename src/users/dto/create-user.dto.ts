import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsEmail, IsInt, Min, Max, Length, IsOptional } from 'class-validator';

export class CreateUserDto {
    @ApiProperty({ example: 'TestUser', description: 'Логин' })
    @IsString()
    @Length(3, 20)
    readonly login: string;

    @ApiProperty({ example: 'TestUser@mail.com', description: 'Email' })
    @IsEmail()
    readonly email: string;

    @ApiProperty({ example: '123', description: 'Пароль' })
    @IsString()
    @Length(3, 30)
    readonly password: string;

    @ApiProperty({ example: '18', description: 'Возраст' })
    @IsInt()
    @Min(1)
    @Max(150)
    readonly age: number;

    @ApiProperty({ example: 'I am a test user', description: 'Описание' })
    @IsOptional()
    @IsString()
    @Length(0, 500)
    readonly description?: string;
}