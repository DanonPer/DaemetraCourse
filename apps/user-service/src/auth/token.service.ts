import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from 'src/users/schemas/user.schema';
import {
  RefreshToken,
  RefreshTokenDocument,
} from './schemas/refresh-token.schema';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectModel(RefreshToken.name)
    private refreshTokenModel: Model<RefreshTokenDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      this.logger.warn(
        'Обновление токенов отклонено: refresh token не передан',
      );
      throw new BadRequestException('Refresh токен не предоставлен');
    }

    try {
      const userData = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('PRIVATE_KEY'),
      });

      this.logger.debug(`Refresh token провалидирован: userId=${userData.id}`);

      const user = await this.userModel.findOne({
        id: userData.id,
        deletedAt: null,
      });
      if (!user) {
        this.logger.warn(
          `Обновление токенов отклонено: пользователь не найден, userId=${userData.id}`,
        );
        throw new NotFoundException('Пользователь не найден');
      }

      const tokenRecord = await this.refreshTokenModel.findOne({
        userId: user.id,
        token: refreshToken,
      });

      if (!tokenRecord) {
        this.logger.warn(
          `Обновление токенов отклонено: токен не найден в БД, userId=${user.id}`,
        );
        throw new UnauthorizedException('Токен не найден или уже использован');
      }

      if (new Date() > tokenRecord.expiresAt) {
        await this.refreshTokenModel.deleteOne({ _id: tokenRecord._id });
        this.logger.warn(
          `Обновление токенов отклонено: refresh token истёк, userId=${user.id}`,
        );
        throw new UnauthorizedException('Refresh токен истек');
      }

      await this.refreshTokenModel.deleteOne({ _id: tokenRecord._id });
      this.logger.log(`Refresh token обновлён успешно: userId=${user.id}`);
      return this.generateAndSaveTokens(user);
    } catch (error) {
      const isKnownException =
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException;

      if (!isKnownException) {
        const message =
          error instanceof Error ? error.message : 'Неизвестная ошибка';
        this.logger.error(
          `Ошибка при обновлении токенов: reason=${message}`,
          error instanceof Error ? error.stack : undefined,
        );
      }

      throw new UnauthorizedException({
        message: 'Refresh токен истек или невалиден',
      });
    }
  }

  async generateAndSaveTokens(user: UserDocument) {
    this.logger.debug(`Генерация и сохранение токенов: userId=${user.id}`);
    const tokens = this.generateToken(user);
    await this.saveRefreshToken(user.id, tokens.refreshToken);
    this.logger.debug(`Токены сохранены: userId=${user.id}`);
    return tokens;
  }

  private generateToken(user: UserDocument) {
    const payload = {
      login: user.login,
      id: user.id,
      roles: user.roles,
    };

    const accessTokenExpiresIn = this.configService.get<string>(
      'ACCESS_TOKEN_EXPIRES_IN',
      '15m',
    );
    const refreshTokenExpiresIn = this.configService.get<string>(
      'REFRESH_TOKEN_EXPIRES_IN',
      '7d',
    );
    const refreshTokenDbExpiresDays = this.configService.get<number>(
      'REFRESH_TOKEN_DB_EXPIRES_DAYS',
      7,
    );

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: accessTokenExpiresIn,
    } as any);

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: refreshTokenExpiresIn,
    } as any);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshTokenDbExpiresDays);

    return {
      accessToken,
      refreshToken,
      expiresAt,
      user: {
        id: user.id,
        login: user.login,
        roles: user.roles,
      },
    };
  }

  private async saveRefreshToken(userId: string, refreshToken: string) {
    const expiresDays = this.configService.get<number>(
      'REFRESH_TOKEN_DB_EXPIRES_DAYS',
      7,
    );
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresDays);

    await this.refreshTokenModel.create({
      userId,
      token: refreshToken,
      expiresAt,
    });

    this.logger.debug(`Refresh token сохранён в БД: userId=${userId}`);
  }
}
