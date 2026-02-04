import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../users.model';
import { FindAndCountOptions } from 'sequelize';

@Injectable()
export class UserRepository {
    constructor(
        @InjectModel(User)
        private readonly userModel: typeof User
    ) {}

    async create(data: any): Promise<User> {
        return this.userModel.create(data);
    }

    async findOne(where: any, include?: any, paranoid?: boolean): Promise<User | null> {
        return this.userModel.findOne({ where, include, paranoid });
    }

    async findByPk(id: string, options?: any): Promise<User | null> {
        return this.userModel.findByPk(id, options);
    }

    async findAndCountAll(options: FindAndCountOptions): Promise<{ count: number; rows: User[] }> {
        return this.userModel.findAndCountAll(options);
    }

    async update(data: any, options: any): Promise<[number, User[]]> {
        return this.userModel.update(data, options);
    }

    async destroy(options: any): Promise<number> {
        return this.userModel.destroy(options);
    }
}