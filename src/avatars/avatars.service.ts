import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { IFileService } from 'src/providers/files.adapter';
import { UsersService } from 'src/users/users.service';
import { IUploadedMulterFile } from 'src/providers/s3/interfaces/upload-file.interface';
import { AvatarRepository } from './repositories/avatar.repository';

@Injectable()
export class AvatarsService {
  private readonly maxActiveAvatarsCount = 5;
  private readonly avatarsFolder = 'users/avatars';

  constructor(
    private readonly avatarRepository: AvatarRepository,
    private readonly usersService: UsersService,
    private readonly fileService: IFileService,
  ) {}

  async uploadAvatar(
    currentUserId: string,
    userId: string,
    file: IUploadedMulterFile,
  ) {
    await this.validateAvatarOwner(currentUserId, userId);

    const activeAvatarsCount = await this.avatarRepository.countDocuments({
      userId,
      deletedAt: null,
    });

    if (activeAvatarsCount >= this.maxActiveAvatarsCount) {
      throw new BadRequestException(
        `У пользователя уже ${this.maxActiveAvatarsCount} активных аватарок`,
      );
    }

    const avatarId = uuidv4();
    const fileExtension = extname(file.originalname || '');
    const fileName = `${avatarId}${fileExtension}`;

    const uploadedFile = await this.fileService.uploadFile({
      file,
      folder: `${this.avatarsFolder}/${userId}`,
      name: fileName,
    });

    return this.avatarRepository.create({
      id: avatarId,
      userId,
      path: uploadedFile.path,
      uploadedAt: new Date(),
      deletedAt: null,
    });
  }

  async removeAvatar(currentUserId: string, userId: string, avatarId: string) {
    await this.validateAvatarOwner(currentUserId, userId);

    const avatar = await this.avatarRepository.findOne({
      id: avatarId,
      userId,
      deletedAt: null,
    });

    if (!avatar) {
      throw new NotFoundException(
        `Активная аватарка с id ${avatarId} не найдена`,
      );
    }

    const deletedAvatar =
      await this.avatarRepository.softDeleteByIdField(avatarId);

    return {
      message: `Аватарка с id ${avatarId} удалена`,
      deletedAt: deletedAvatar?.deletedAt ?? new Date(),
    };
  }

  private async validateAvatarOwner(currentUserId: string, userId: string) {
    if (currentUserId !== userId) {
      throw new ForbiddenException(
        'Нельзя загружать или удалять аватарки чужого профиля',
      );
    }

    const user = await this.usersService.getActiveUserById(userId);
    if (!user) {
      throw new NotFoundException(`Пользователь с id ${userId} не найден`);
    }
  }
}
