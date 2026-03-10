import { Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { User } from "src/users/users.model";
import { Role } from "./roles.model";


@Table({ tableName: 'user_roles', createdAt: false, updatedAt: false })
export class UserRole extends Model<UserRole> {

    @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true, allowNull: false})
        declare id: string;

    @ForeignKey(() => Role)
    @Column({ type: DataType.UUID, allowNull: false })
        roleId: string;

    @ForeignKey(() => User)
    @Column({ type: DataType.UUID, allowNull: false })
        userId: string;

}