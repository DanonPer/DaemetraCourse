import { Body, Controller, Post } from '@nestjs/common';
import { SendNotificationDto } from './dto/send-notification.dto';
import { NotificationGateway } from './notification.gateway';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationGateway: NotificationGateway) {}

  @Post()
  sendNotification(@Body() sendNotificationDto: SendNotificationDto): {
    delivered: boolean;
  } {
    this.notificationGateway.sendNotification(sendNotificationDto.userId, {
      data: sendNotificationDto.data,
    });

    return { delivered: true };
  }
}
