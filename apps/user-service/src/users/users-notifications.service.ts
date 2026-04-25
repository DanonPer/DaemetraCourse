import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { NOTIFICATION_SEND_TOPIC, NotificationEvent } from '@app/common';

@Injectable()
export class UsersNotificationsService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(UsersNotificationsService.name);

  constructor(
    @Inject('NOTIFICATION_KAFKA_CLIENT')
    private readonly client: ClientKafka,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.client.connect();
    this.logger.log('Kafka producer connected');
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.close();
  }

  sendNotification(event: NotificationEvent): void {
    this.client.emit(NOTIFICATION_SEND_TOPIC, event).subscribe({
      error: (error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(
          `Failed to publish notification event for recipientUserId=${event.recipientUserId}: ${message}`,
        );
      },
    });

    this.logger.log(
      `Notification event published for recipientUserId=${event.recipientUserId}`,
    );
  }
}
