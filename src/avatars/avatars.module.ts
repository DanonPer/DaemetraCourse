import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { FilesModule } from 'src/providers/files.module';
import { UsersModule } from 'src/users/users.module';
import { AvatarsController } from './avatars.controller';
import { AvatarsService } from './avatars.service';
import { AvatarRepository } from './repositories/avatar.repository';
import { Avatar, AvatarSchema } from './schemas/avatar.schema';

@Module({
  controllers: [AvatarsController],
  providers: [AvatarsService, AvatarRepository],
  imports: [
    MongooseModule.forFeature([{ name: Avatar.name, schema: AvatarSchema }]),
    AuthModule,
    UsersModule,
    FilesModule,
  ],
})
export class AvatarsModule {}
