import { forwardRef, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { RolesModule } from 'src/roles/roles.module';
import { AuthModule } from 'src/auth/auth.module';
import { UserRepository } from './repositories/user.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { UsersNotificationsService } from './users-notifications.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UserRepository, UsersNotificationsService],
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'NOTIFICATION_KAFKA_CLIENT',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'user-service',
              brokers: configService
                .get<string>('KAFKA_BROKERS', 'localhost:9092')
                .split(','),
            },
            producerOnlyMode: true,
          },
        }),
      },
    ]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    RolesModule,
    forwardRef(() => AuthModule),
  ],
  exports: [UsersService, MongooseModule],
})
export class UsersModule {}
