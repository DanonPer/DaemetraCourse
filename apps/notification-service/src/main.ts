import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { NotificationServiceModule } from './notification-service.module';

async function bootstrap() {
  const app = await NestFactory.create(NotificationServiceModule);
  const configService = app.get(ConfigService);
  const kafkaBrokers = configService
    .get<string>('KAFKA_BROKERS', 'localhost:9092')
    .split(',');
  const port = configService.get<number>('NOTIFICATION_SERVICE_PORT', 3000);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'notification-service',
        brokers: kafkaBrokers,
      },
      consumer: {
        groupId: 'notification-service-consumer',
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(port);
}
void bootstrap();
