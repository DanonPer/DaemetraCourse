import { ApiProperty } from "@nestjs/swagger";

export class CreateUserDto {
    @ApiProperty({example: 'TestUser', description: 'Логин'})
    readonly login: string;
    @ApiProperty({example: 'TestUser@mail.com', description: 'Email'})
    readonly email: string;
    @ApiProperty({example: '123', description: 'Пароль'})
    readonly password: string;
    @ApiProperty({example: '18', description: 'Возраст'}) 
    readonly age: number;
    @ApiProperty({example: 'I am a test user', description: 'Описание'})
    readonly description?: string;
}


        
        
       
    