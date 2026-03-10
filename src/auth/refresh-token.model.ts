import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from '../users/users.model';

@Table({ tableName: 'refresh_tokens' })
export class RefreshToken extends Model {
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        primaryKey: true
    })
    declare id: string;

    @ForeignKey(() => User)
    @Column({ 
        type: DataType.UUID,
        allowNull: false 
    })
    userId: string;

    @Column({ 
        type: DataType.TEXT,
        allowNull: false,
        unique: true
    })
    token: string;

    @Column({ 
        type: DataType.DATE,
        allowNull: false 
    })
    expiresAt: Date;

    @BelongsTo(() => User)
    user: User;
}