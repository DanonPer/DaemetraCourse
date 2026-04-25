import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ClientSession, Connection } from 'mongoose';
import { RedisCacheService } from 'src/cache/redis-cache.service';
import { RolesService } from 'src/roles/roles.service';
import { CreateUserDto } from './dto/create-user.dto';
import { GetMostActiveUsersDto } from './dto/get-most-active-users.dto';
import { GetUsersDto } from './dto/get-users.dto';
import { TransferMoneyDto } from './dto/transfer-money.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersNotificationsService } from './users-notifications.service';
import { UserRepository } from './repositories/user.repository';

const USERS_CACHE_TTL_SECONDS = 30;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private userRepository: UserRepository,
    private roleService: RolesService,
    private redisCacheService: RedisCacheService,
    private readonly usersNotificationsService: UsersNotificationsService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async createUser(dto: CreateUserDto) {
    const role = await this.roleService.getRoleByValue('USER');
    if (!role) {
      throw new NotFoundException('Роли "USER" нет в БД');
    }

    const user = await this.userRepository.create({
      ...dto,
      balance: 0,
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

    const where: Record<string, unknown> = { deletedAt: null };
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

    const data = { ...updateUserDto } as UpdateUserDto & { roles?: string[] };
    const roles = (updateUserDto as UpdateUserDto & { roles?: string[] }).roles;
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

  async resetAllBalances() {
    this.logger.log('Запущено массовое обнуление баланса пользователей');

    const result = await this.userRepository.resetAllBalances();
    await this.redisCacheService.deleteByPattern('users:*');

    this.logger.log(
      `Массовое обнуление баланса завершено, изменено пользователей: ${result.modifiedCount}`,
    );

    return {
      modifiedCount: result.modifiedCount,
    };
  }

  async transferMoney(transferMoneyDto: TransferMoneyDto) {
    const { fromUserId, toUserId, amount } = transferMoneyDto;

    this.logger.log(
      `Запрошен перевод денег: fromUserId=${fromUserId}, toUserId=${toUserId}, amount=${amount}`,
    );

    if (fromUserId === toUserId) {
      this.logger.warn(
        `Отклонён перевод самому себе: userId=${fromUserId}, amount=${amount}`,
      );
      throw new BadRequestException('Вы не можете перевести деньги сами себе');
    }

    const transferAmountInCents = this.parseAmountToCents(amount);
    const session = await this.connection.startSession();

    try {
      let transferResult:
        | {
            message: string;
            amount: string;
            fromUser: { id: string; balance: number };
            toUser: { id: string; balance: number };
          }
        | undefined;

      try {
        await session.withTransaction(async () => {
          transferResult = await this.executeTransfer(
            fromUserId,
            toUserId,
            amount,
            transferAmountInCents,
            session,
          );
        });
      } catch (error) {
        if (!this.isTransactionsUnsupportedError(error)) {
          throw error;
        }

        this.logger.warn(
          'MongoDB transactions are unavailable, using a non-transactional transfer fallback',
        );

        transferResult = await this.executeTransfer(
          fromUserId,
          toUserId,
          amount,
          transferAmountInCents,
        );
      }

      await this.redisCacheService.deleteByPattern('users:*');
      if (!transferResult) {
        throw new BadRequestException('Transfer result was not created');
      }
      const transferredAt = new Date().toISOString();

      this.usersNotificationsService.sendNotification({
        recipientUserId: fromUserId,
        senderUserId: fromUserId,
        receiverUserId: toUserId,
        amount: transferResult.amount,
        transferredAt,
        data: `You sent $${transferResult.amount} to user ${toUserId}`,
      });
      this.usersNotificationsService.sendNotification({
        recipientUserId: toUserId,
        senderUserId: fromUserId,
        receiverUserId: toUserId,
        amount: transferResult.amount,
        transferredAt,
        data: `You received $${transferResult.amount} from user ${fromUserId}`,
      });

      return transferResult;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Неизвестная ошибка';
      const stack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Ошибка при переводе денег: fromUserId=${fromUserId}, toUserId=${toUserId}, amount=${amount}, reason=${message}`,
        stack,
      );

      throw error;
    } finally {
      await session.endSession();
      this.logger.debug(
        `Сессия перевода завершена: fromUserId=${fromUserId}, toUserId=${toUserId}`,
      );
    }
  }

  private parseAmountToCents(amount: string) {
    const [dollarsPart, centsPart = ''] = amount.split('.');
    const dollars = Number(dollarsPart);
    const cents = Number(centsPart.padEnd(2, '0'));
    const total = dollars * 100 + cents;

    if (!Number.isInteger(total) || total <= 0) {
      throw new BadRequestException('Сумма перевода должна быть больше 0');
    }

    return total;
  }

  private balanceToCents(balance: number | undefined) {
    return Math.round((balance ?? 0) * 100);
  }

  private centsToDollars(cents: number) {
    return Number((cents / 100).toFixed(2));
  }

  private formatCentsAsAmount(cents: number) {
    return this.centsToDollars(cents).toFixed(2);
  }

  private async executeTransfer(
    fromUserId: string,
    toUserId: string,
    amount: string,
    transferAmountInCents: number,
    session?: ClientSession,
  ) {
    const [fromUser, toUser] = await Promise.all([
      this.userRepository.findOne({ id: fromUserId, deletedAt: null }, session),
      this.userRepository.findOne({ id: toUserId, deletedAt: null }, session),
    ]);

    if (!fromUser) {
      this.logger.warn(
        `Перевод отклонён: отправитель не найден, fromUserId=${fromUserId}`,
      );
      throw new NotFoundException(
        `Отправитель с идентификатором ${fromUserId} не найден`,
      );
    }

    if (!toUser) {
      this.logger.warn(
        `Перевод отклонён: получатель не найден, toUserId=${toUserId}`,
      );
      throw new NotFoundException(
        `Получатель с идентификатором ${toUserId} не найден`,
      );
    }

    const senderBalanceInCents = this.balanceToCents(fromUser.balance);
    if (senderBalanceInCents < transferAmountInCents) {
      this.logger.warn(
        `Перевод отклонён из-за нехватки средств: fromUserId=${fromUserId}, balanceInCents=${senderBalanceInCents}, transferAmountInCents=${transferAmountInCents}`,
      );
      throw new BadRequestException('Недостаточно средств');
    }

    const receiverBalanceInCents = this.balanceToCents(toUser.balance);
    const updatedSenderBalance = this.centsToDollars(
      senderBalanceInCents - transferAmountInCents,
    );
    const updatedReceiverBalance = this.centsToDollars(
      receiverBalanceInCents + transferAmountInCents,
    );

    await Promise.all([
      this.userRepository.updateByIdField(
        fromUserId,
        { balance: updatedSenderBalance },
        session,
      ),
      this.userRepository.updateByIdField(
        toUserId,
        { balance: updatedReceiverBalance },
        session,
      ),
    ]);

    this.logger.log(
      `Перевод выполнен успешно: fromUserId=${fromUserId}, toUserId=${toUserId}, amount=${amount}, senderBalance=${updatedSenderBalance}, receiverBalance=${updatedReceiverBalance}`,
    );

    return {
      message: 'Передача успешно завершена',
      amount: this.formatCentsAsAmount(transferAmountInCents),
      fromUser: {
        id: fromUserId,
        balance: updatedSenderBalance,
      },
      toUser: {
        id: toUserId,
        balance: updatedReceiverBalance,
      },
    };
  }

  private isTransactionsUnsupportedError(error: unknown) {
    return (
      error instanceof Error &&
      error.message.includes(
        'Transaction numbers are only allowed on a replica set member or mongos',
      )
    );
  }
}
