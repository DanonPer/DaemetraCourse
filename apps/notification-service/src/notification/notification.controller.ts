import { Body, Controller, Logger, Post } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NOTIFICATION_SEND_TOPIC } from '@app/common';
import type { NotificationEvent } from '@app/common';
import { SendNotificationDto } from './dto/send-notification.dto';
import { NotificationGateway } from './notification.gateway';
import { NotificationStorageService } from './notification-storage.service';

@Controller('notification')
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);

  constructor(
    private readonly notificationGateway: NotificationGateway,
    private readonly notificationStorageService: NotificationStorageService,
  ) {}

  @Post()
  sendNotification(@Body() sendNotificationDto: SendNotificationDto): {
    delivered: boolean;
  } {
    this.notificationGateway.sendNotification(sendNotificationDto.userId, {
      data: sendNotificationDto.data,
    });

    return { delivered: true };
  }

  @EventPattern(NOTIFICATION_SEND_TOPIC)
  async handleNotificationEvent(
    @Payload() notificationEvent: NotificationEvent,
  ): Promise<void> {
    await this.notificationStorageService.createFromEvent(notificationEvent);

    this.notificationGateway.sendNotification(
      notificationEvent.recipientUserId,
      {
        data: notificationEvent.data,
      },
    );
    this.logger.log(
      `Kafka notification saved and delivered to userId=${notificationEvent.recipientUserId}`,
    );
  }
}
