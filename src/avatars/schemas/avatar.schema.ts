import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type AvatarDocument = HydratedDocument<Avatar>;

@Schema({ timestamps: true, versionKey: false })
export class Avatar {
  @Prop({ type: String, default: uuidv4, unique: true, index: true })
  id: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  path: string;

  @Prop({ required: true, default: () => new Date() })
  uploadedAt: Date;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const AvatarSchema = SchemaFactory.createForClass(Avatar);
