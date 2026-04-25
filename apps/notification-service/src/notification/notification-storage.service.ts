import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotificationEvent } from '@app/common';
import {
  Notification,
  NotificationDocument,
} from './schemas/notification.schema';

@Injectable()
export class NotificationStorageService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  async createFromEvent(event: NotificationEvent) {
    return this.notificationModel.create({
      recipientUserId: event.recipientUserId,
      senderUserId: event.senderUserId,
      receiverUserId: event.receiverUserId,
      amount: event.amount,
      transferredAt: new Date(event.transferredAt),
      data: event.data,
    });
  }
}
