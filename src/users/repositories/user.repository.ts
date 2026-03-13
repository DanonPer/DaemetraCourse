import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, UserDocument } from "../schemas/user.schema";

@Injectable()
export class UserRepository {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  create(data: Partial<User>) {
    return this.userModel.create(data);
  }

  findOne(filter: Record<string, any>) {
    return this.userModel.findOne(filter).exec();
  }

  findByIdField(id: string) {
    return this.userModel.findOne({ id }).exec();
  }

  async findAndCount(filter: Record<string, any>, limit: number, offset: number) {
    const [count, rows] = await Promise.all([
      this.userModel.countDocuments(filter).exec(),
      this.userModel.find(filter).skip(offset).limit(limit).exec(),
    ]);

    return { count, rows };
  }

  updateByIdField(id: string, data: Partial<User>) {
    return this.userModel.findOneAndUpdate({ id }, data, { new: true }).exec();
  }

  softDeleteByIdField(id: string) {
    return this.userModel
      .findOneAndUpdate({ id }, { deletedAt: new Date() }, { new: true })
      .exec();
  }
}
