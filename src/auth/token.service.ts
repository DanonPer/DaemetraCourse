import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  RefreshToken,
  RefreshTokenDocument,
} from './schemas/refresh-token.schema';
import { User, UserDocument } from 'src/users/schemas/user.schema';

@Injectable()
export class TokenService {
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
      throw new BadRequestException('Refresh токен не предоставлен');
    }

    try {
      const userData = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('PRIVATE_KEY'),
      });

      const user = await this.userModel.findOne({
        id: userData.id,
        deletedAt: null,
      });
      if (!user) {
        throw new NotFoundException('Пользователь не найден');
      }

      const tokenRecord = await this.refreshTokenModel.findOne({
        userId: user.id,
        token: refreshToken,
      });

      if (!tokenRecord) {
        throw new UnauthorizedException('Токен не найден или уже использован');
      }

      if (new Date() > tokenRecord.expiresAt) {
        await this.refreshTokenModel.deleteOne({ _id: tokenRecord._id });
        throw new UnauthorizedException('Refresh токен истек');
      }

      await this.refreshTokenModel.deleteOne({ _id: tokenRecord._id });
      return this.generateAndSaveTokens(user);
    } catch {
      throw new UnauthorizedException({
        message: 'Refresh токен истек или невалиден',
      });
    }
  }

  async generateAndSaveTokens(user: UserDocument) {
    const tokens = this.generateToken(user);
    await this.saveRefreshToken(user.id, tokens.refreshToken);
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
  }
}
