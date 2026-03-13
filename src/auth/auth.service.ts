import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcryptjs';
import { UserDocument } from 'src/users/schemas/user.schema';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private tokenService: TokenService,
  ) {}

  async login(userDto: CreateUserDto) {
    const user = await this.validateUser(userDto);
    return this.tokenService.generateAndSaveTokens(user);
  }

  async registration(userDto: CreateUserDto) {
    const candidate = await this.userService.getUserByLogin(userDto.login);

    if (candidate) {
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

    return this.tokenService.generateAndSaveTokens(user);
  }

  async refresh(refreshToken: string) {
    return this.tokenService.refresh(refreshToken);
  }

  private async validateUser(userDto: CreateUserDto): Promise<UserDocument> {
    const user = await this.userService.getUserByLogin(userDto.login);

    if (!user) {
      throw new UnauthorizedException({
        message: 'Некорректный логин или пароль',
      });
    }

    const passwordEquals = await bcrypt.compare(
      userDto.password,
      user.password,
    );

    if (!passwordEquals) {
      throw new UnauthorizedException({
        message: 'Некорректный логин или пароль',
      });
    }

    return user;
  }
}
