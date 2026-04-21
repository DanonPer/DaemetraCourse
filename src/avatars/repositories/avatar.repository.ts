import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Avatar, AvatarDocument } from '../schemas/avatar.schema';

@Injectable()
export class AvatarRepository {
  constructor(
    @InjectModel(Avatar.name)
    private readonly avatarModel: Model<AvatarDocument>,
  ) {}

  create(data: Partial<Avatar>) {
    return this.avatarModel.create(data);
  }

  findOne(filter: Record<string, any>) {
    return this.avatarModel.findOne(filter).exec();
  }

  countDocuments(filter: Record<string, any>) {
    return this.avatarModel.countDocuments(filter).exec();
  }

  softDeleteByIdField(id: string) {
    return this.avatarModel
      .findOneAndUpdate({ id }, { deletedAt: new Date() }, { new: true })
      .exec();
  }
}
