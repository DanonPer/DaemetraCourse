import { forwardRef, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtSignOptions } from '@nestjs/jwt';
import { SequelizeModule } from '@nestjs/sequelize';
import { RefreshToken } from './refresh-token.model';
import { TokenService } from './token.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, TokenService],
  imports: [
    SequelizeModule.forFeature([RefreshToken]),
    forwardRef(() => UsersModule),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => {
        const expiresIn = configService.get<string>('ACCESS_TOKEN_EXPIRES_IN') || '15m';
        return {
          secret: configService.get<string>('PRIVATE_KEY'),
          signOptions: {
            expiresIn: expiresIn
          } as JwtSignOptions
        };
      },
      inject: [ConfigService]
    })
  ],
  exports: [ AuthService, JwtModule, TokenService ]
})
export class AuthModule {}