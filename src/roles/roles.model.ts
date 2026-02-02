import { BelongsToMany, Column, DataType, Model, Table } from "sequelize-typescript";
import { User } from "src/users/users.model";
import { UserRole } from "./user-roles.model";
import { v4 as uuidv4 } from 'uuid'; 

interface RoleCreationAttrs {
    value: string;
    description: string;
}

@Table({ tableName: 'roles' })
export class Role extends Model<Role, RoleCreationAttrs> {

    @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true, allowNull: false})
        declare id: string;

    @Column({ type: DataType.STRING, unique: true, allowNull: false })
        value: string;

    @Column({ type: DataType.STRING, allowNull: false })
        description: string;

    @BelongsToMany(() => User, () => UserRole)
        users: User[];
}