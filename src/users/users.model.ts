import { ApiProperty } from "@nestjs/swagger";
import { BelongsToMany, Column, DataType, Model, Table } from "sequelize-typescript";
import { Role } from "src/roles/roles.model";
import { UserRole } from "src/roles/user-roles.model";

interface UserCreationAttrs {
    login: string;
    email: string;
    password: string;
    age: number;
    description?: string;
}

@Table({ tableName: 'users' })
export class User extends Model<User, UserCreationAttrs> {
    @ApiProperty({example: '1', description: 'Уникальный идентификатор'})
    @Column({ type: DataType.INTEGER, unique: true, autoIncrement: true, primaryKey: true })
        declare id: number;

    @ApiProperty({example: 'TestUser', description: 'Логин'})
    @Column({ type: DataType.STRING, unique: true, allowNull: false })
        login: string;

    @ApiProperty({example: 'TestUser@mail.com', description: 'Email'})    
    @Column({ type: DataType.STRING, unique: true, allowNull: false })
        email: string;
    
    @ApiProperty({example: '123', description: 'Пароль'})    
    @Column({ type: DataType.STRING, allowNull: false })
        password: string;

    @ApiProperty({example: '18', description: 'Возраст'})    
    @Column({ type: DataType.INTEGER, allowNull: false })
        age: number;

    @ApiProperty({example: 'I am a test user', description: 'Описание'})    
    @Column({ type: DataType.STRING(1000),allowNull: true, defaultValue: ""})
        description: string;

    @BelongsToMany(() => Role, () => UserRole)
        roles: Role[];
}