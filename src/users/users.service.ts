import { Injectable, NotFoundException } from '@nestjs/common';
import { RedisCacheService } from 'src/cache/redis-cache.service';
import { RolesService } from 'src/roles/roles.service';
import { CreateUserDto } from './dto/create-user.dto';
import { GetMostActiveUsersDto } from './dto/get-most-active-users.dto';
import { GetUsersDto } from './dto/get-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRepository } from './repositories/user.repository';

const USERS_CACHE_TTL_SECONDS = 30;

@Injectable()
export class UsersService {
  constructor(
    private userRepository: UserRepository,
    private roleService: RolesService,
    private redisCacheService: RedisCacheService,
  ) {}

  async createUser(dto: CreateUserDto) {
    const role = await this.roleService.getRoleByValue('USER');
    if (!role) {
      throw new NotFoundException('Роли "USER" нет в БД');
    }

    const user = await this.userRepository.create({
      ...dto,
      roles: [role.value],
      deletedAt: null,
    });

    await this.redisCacheService.deleteByPattern('users:*');
    return user;
  }

  async getAllUsers(getUsersDto: GetUsersDto) {
    const { login, page = 1, limit = 10 } = getUsersDto;
    const cacheKey = `users:list:${login ?? ''}:${page}:${limit}`;
    const cachedUsers = await this.redisCacheService.get(cacheKey);
    if (cachedUsers !== undefined) {
      return cachedUsers;
    }

    const offset = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (login) {
      where.login = { $regex: login, $options: 'i' };
    }

    const { count, rows: users } = await this.userRepository.findAndCount(
      where,
      limit,
      offset,
    );

    const response = {
      users,
      pagination: {
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };

    await this.redisCacheService.set(
      cacheKey,
      response,
      USERS_CACHE_TTL_SECONDS,
    );

    return response;
  }

  async getMostActiveUsers(getMostActiveUsersDto: GetMostActiveUsersDto) {
    const { page = 1, limit = 10 } = getMostActiveUsersDto;
    const { total, users } = await this.userRepository.findMostActiveUsers(
      getMostActiveUsersDto,
    );

    return {
      users,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        page,
        limit,
      },
    };
  }

  async getUserByEmail(email: string) {
    return this.userRepository.findOne({ email, deletedAt: null });
  }

  async getUserByLogin(login: string) {
    return this.userRepository.findOne({ login, deletedAt: null });
  }

  async getUserById(id: string) {
    return this.userRepository.findOne({ id });
  }

  async getActiveUserById(id: string) {
    const cacheKey = `users:profile:${id}`;
    const cachedUser = await this.redisCacheService.get(cacheKey);
    if (cachedUser !== undefined) {
      return cachedUser;
    }

    const user = await this.userRepository.findOne({ id, deletedAt: null });
    await this.redisCacheService.set(cacheKey, user, USERS_CACHE_TTL_SECONDS);

    return user;
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.findOne({ id, deletedAt: null });
    if (!user) {
      throw new NotFoundException(`Пользователь с id ${id} не найден`);
    }

    const data: any = { ...updateUserDto };
    const roles = (updateUserDto as any).roles;
    if (roles) {
      data.roles = roles;
    }

    const updatedUser = await this.userRepository.updateByIdField(id, data);
    await this.redisCacheService.deleteByPattern('users:*');

    return updatedUser;
  }

  async softDeleteUser(id: string) {
    const user = await this.userRepository.findOne({ id, deletedAt: null });
    if (!user) {
      throw new NotFoundException(`Пользователь с id ${id} не найден`);
    }

    await this.userRepository.softDeleteByIdField(id);
    await this.redisCacheService.deleteByPattern('users:*');

    return {
      message: `Пользователь с id ${id} - удалён`,
      deletedAt: new Date(),
    };
  }
}
