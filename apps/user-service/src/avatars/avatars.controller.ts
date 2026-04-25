import {
  Controller,
  Delete,
  FileTypeValidator,
  Param,
  ParseFilePipe,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UserDecorator } from '@app/common';
import type { IUploadedMulterFile } from 'src/providers/s3/interfaces/upload-file.interface';
import { AvatarsService } from './avatars.service';
import { Avatar } from './schemas/avatar.schema';

@ApiTags('Аватарки')
@Controller('users/:userId/avatars')
export class AvatarsController {
  constructor(private readonly avatarsService: AvatarsService) {}

  @ApiOperation({ summary: 'Загрузка аватарки пользователя' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, type: Avatar })
  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(
    @UserDecorator('id') currentUserId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: /^image\/.+$/ })],
        fileIsRequired: true,
      }),
    )
    file: IUploadedMulterFile,
  ) {
    return this.avatarsService.uploadAvatar(currentUserId, userId, file);
  }

  @ApiOperation({ summary: 'Удаление аватарки пользователя' })
  @ApiResponse({ status: 200 })
  @Delete(':avatarId')
  @UseGuards(JwtAuthGuard)
  removeAvatar(
    @UserDecorator('id') currentUserId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('avatarId', ParseUUIDPipe) avatarId: string,
  ) {
    return this.avatarsService.removeAvatar(currentUserId, userId, avatarId);
  }
}
