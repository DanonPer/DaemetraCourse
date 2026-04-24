import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { NotificationController } from './notification.controller';
import { NotificationAuthService } from './notification-auth.service';
import { NotificationGateway } from './notification.gateway';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const expiresIn =
          configService.get<string>('ACCESS_TOKEN_EXPIRES_IN') ?? '15m';

        return {
          secret: configService.get<string>('PRIVATE_KEY'),
          signOptions: { expiresIn } as JwtSignOptions,
        };
      },
    }),
  ],
  controllers: [NotificationController],
  providers: [NotificationGateway, NotificationAuthService],
  exports: [NotificationGateway],
})
export class NotificationModule {}
