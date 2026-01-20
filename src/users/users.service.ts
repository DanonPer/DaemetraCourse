import { Injectable } from '@nestjs/common';
import { User } from './users.model';
import { InjectModel } from '@nestjs/sequelize';
import { CreateUserDto } from './dto/create-user.dto';
import { RolesService } from 'src/roles/roles.service';
import { GetUsersDto } from './dto/get-users.dto';
import { Op } from 'sequelize';

@Injectable()
export class UsersService {

    constructor(@InjectModel(User) private userRepository: typeof User, private roleService: RolesService) {}

    async createUser(dto: CreateUserDto){
        const user = await this.userRepository.create(dto);
        const role = await this.roleService.getRoleByValue("USER")
        if (!role) {
            throw new Error('Роли "USER" нет в БД');
        }
        await user.$set('roles', [role.id])
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
        page: +page,
        limit: +limit,
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

    async getUserById(id: number){
        const user = await this.userRepository.findOne({where:{id}, include: {all:true}})
        return user;
    }
}
