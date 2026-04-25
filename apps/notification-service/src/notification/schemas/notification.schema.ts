import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({ timestamps: true, versionKey: false })
export class Notification {
  @Prop({ type: String, default: uuidv4, unique: true, index: true })
  id: string;

  @Prop({ required: true, index: true })
  recipientUserId: string;

  @Prop({ required: true })
  senderUserId: string;

  @Prop({ required: true })
  receiverUserId: string;

  @Prop({ required: true })
  amount: string;

  @Prop({ required: true })
  transferredAt: Date;

  @Prop({ required: true })
  data: string;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
