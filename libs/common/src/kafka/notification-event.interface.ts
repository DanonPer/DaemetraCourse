export const NOTIFICATION_SEND_TOPIC = 'notifications.send';

export interface NotificationEvent {
  recipientUserId: string;
  senderUserId: string;
  receiverUserId: string;
  amount: string;
  transferredAt: string;
  data: string;
}
