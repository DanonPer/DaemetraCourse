import { forwardRef, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/users/users.module';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenService } from './token.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  RefreshToken,
  RefreshTokenSchema,
} from './schemas/refresh-token.schema';
import { User, UserSchema } from 'src/users/schemas/user.schema';

@Module({
  controllers: [AuthController],
  providers: [AuthService, TokenService],
  imports: [
    MongooseModule.forFeature([
      { name: RefreshToken.name, schema: RefreshTokenSchema },
      { name: User.name, schema: UserSchema },
    ]),
    forwardRef(() => UsersModule),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => {
        const expiresIn =
          configService.get<string>('ACCESS_TOKEN_EXPIRES_IN') || '15m';
        return {
          secret: configService.get<string>('PRIVATE_KEY'),
          signOptions: { expiresIn } as JwtSignOptions,
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [AuthService, JwtModule, TokenService],
})
export class AuthModule {}
