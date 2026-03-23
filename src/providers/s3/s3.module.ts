import * as AWS from '@aws-sdk/client-s3';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { S3Lib } from './constants/do-spaces-service-lib.constant';
import { S3Service } from './s3.service';

@Module({
  imports: [ConfigModule],
  providers: [
    S3Service,
    {
      provide: S3Lib,
      useFactory: (configService: ConfigService) => {
        const endpoint = configService.get<string>(
          'MINIO_ENDPOINT',
          '127.0.0.1',
        );
        const port = configService.get<string>('MINIO_PORT', '9000');
        const useSsl =
          configService.get<string>('MINIO_USE_SSL', 'false') === 'true';
        const protocol = useSsl ? 'https' : 'http';
        const accessKeyId = configService.get<string>(
          'MINIO_ACCESS_KEY',
          'minioadmin',
        );
        const secretAccessKey = configService.get<string>(
          'MINIO_SECRET_KEY',
          'minioadmin',
        );

        return new AWS.S3({
          endpoint: `${protocol}://${endpoint}:${port}`,
          region: 'ru-central1',
          forcePathStyle: true,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [S3Service, S3Lib],
})
export class S3Module {}
