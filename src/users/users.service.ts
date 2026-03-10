import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { RolesService } from 'src/roles/roles.service';
import { GetUsersDto } from './dto/get-users.dto';
import { Op } from 'sequelize';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRepository } from './repositories/user.repository';

@Injectable()
export class UsersService {
    constructor( private userRepository: UserRepository, private roleService: RolesService) {}

    async createUser(dto: CreateUserDto){
        const user = await this.userRepository.create(dto);
        const role = await this.roleService.getRoleByValue("USER")
        if (!role) {
            throw new NotFoundException('Роли "USER" нет в БД');
        }
        await user.$set('roles', [role.id.toString()])
        user.roles = [role]
        return user;
    }

    async getAllUsers(getUsersDto: GetUsersDto) {
        const { login, page = 1, limit = 10 } = getUsersDto;
        const offset = (page - 1) * limit;
    
        const where: any = {};
        if (login) {
            where.login = {
            [Op.iLike]: `%${login}%`
      };
    }
    
    const { count, rows: users } = await this.userRepository.findAndCountAll({
        where,
        limit,
        offset,
        include: { all: true },
        distinct: true,
    });
    
    return {
      users,
      pagination: {
        total: count,
        totalPages: Math.ceil(count / limit),
      }
    };
  }

    async getUserByEmail(email: string){
        const user = await this.userRepository.findOne({where:{email}, include: {all:true}})
        return user;
    }

    async getUserByLogin(login: string){
        const user = await this.userRepository.findOne({where:{login}, include: {all:true}})
        return user;
    }

    async getUserById(id: string){
        const user = await this.userRepository.findOne({where:{id}, include: {all:true},paranoid: false});
        return user;
    }

    async updateUser(id: string, updateUserDto: UpdateUserDto) {
        const user = await this.userRepository.findByPk(id);
        
        if (!user) {
            throw new NotFoundException(`Пользователь с id ${id} не найден`);
        }

        await user.update(updateUserDto);
        
        if (updateUserDto.hasOwnProperty('roles')) {
            await user.$set('roles', updateUserDto['roles']);
        }

        return await this.userRepository.findByPk(id, {
            include: { all: true }
        });
    }

    async softDeleteUser(id: string) {
        const user = await this.userRepository.findByPk(id);

        if (!user) {
            throw new NotFoundException(`Пользователь с id ${id} не найден`);
        }

        await user.destroy();
        return { 
            message: `Пользователь с id ${id} - удалён`,
            deletedAt: new Date() 
        };
    }
}