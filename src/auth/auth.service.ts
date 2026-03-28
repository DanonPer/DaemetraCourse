import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UserDocument } from 'src/users/schemas/user.schema';
import { UsersService } from 'src/users/users.service';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private userService: UsersService,
    private tokenService: TokenService,
  ) {}

  async login(userDto: CreateUserDto) {
    this.logger.log(`Попытка входа: login=${userDto.login}`);

    const user = await this.validateUser(userDto);
    const tokens = await this.tokenService.generateAndSaveTokens(user);

    this.logger.log(`Успешный вход: userId=${user.id}, login=${user.login}`);
    return tokens;
  }

  async registration(userDto: CreateUserDto) {
    this.logger.log(`Попытка регистрации: login=${userDto.login}`);

    const candidate = await this.userService.getUserByLogin(userDto.login);

    if (candidate) {
      this.logger.warn(
        `Регистрация отклонена: login уже существует, login=${userDto.login}`,
      );
      throw new HttpException(
        'Пользователь с таким login существует',
        HttpStatus.BAD_REQUEST,
      );
    }

    const hashPassword = await bcrypt.hash(userDto.password, 5);
    const user = await this.userService.createUser({
      ...userDto,
      password: hashPassword,
    });

    this.logger.log(
      `Пользователь зарегистрирован: userId=${user.id}, login=${user.login}`,
    );
    return this.tokenService.generateAndSaveTokens(user);
  }

  async refresh(refreshToken: string) {
    this.logger.log('Запрошено обновление токенов');
    return this.tokenService.refresh(refreshToken);
  }

  private async validateUser(userDto: CreateUserDto): Promise<UserDocument> {
    const user = await this.userService.getUserByLogin(userDto.login);

    if (!user) {
      this.logger.warn(
        `Неуспешный вход: пользователь не найден, login=${userDto.login}`,
      );
      throw new UnauthorizedException({
        message: 'Некорректный логин или пароль',
      });
    }

    const passwordEquals = await bcrypt.compare(
      userDto.password,
      user.password,
    );

    if (!passwordEquals) {
      this.logger.warn(
        `Неуспешный вход: неверный пароль, userId=${user.id}, login=${user.login}`,
      );
      throw new UnauthorizedException({
        message: 'Некорректный логин или пароль',
      });
    }

    this.logger.debug(
      `Проверка пользователя прошла успешно: userId=${user.id}`,
    );
    return user;
  }
}
