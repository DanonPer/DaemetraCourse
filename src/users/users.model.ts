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
    @Column({ type: DataType.INTEGER, unique: true, autoIncrement: true, primaryKey: true })
        declare id: number;

    @Column({ type: DataType.STRING, unique: true, allowNull: false })
        login: string;

    @Column({ type: DataType.STRING, unique: true, allowNull: false })
        email: string;

    @Column({ type: DataType.STRING, allowNull: false })
        password: string;

    @Column({ type: DataType.INTEGER, allowNull: false })
        age: number;

    @Column({ type: DataType.STRING(1000),allowNull: true, defaultValue: ""})
        description: string;

    @BelongsToMany(() => Role, () => UserRole)
        roles: Role[];
}