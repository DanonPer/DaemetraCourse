import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import { GetMostActiveUsersDto } from '../dto/get-most-active-users.dto';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class UserRepository {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  create(data: Partial<User>) {
    return this.userModel.create(data);
  }

  findOne(filter: Record<string, any>, session?: ClientSession) {
    return this.userModel.findOne(filter, null, { session }).exec();
  }

  findByIdField(id: string, session?: ClientSession) {
    return this.userModel.findOne({ id }, null, { session }).exec();
  }

  async findAndCount(
    filter: Record<string, any>,
    limit: number,
    offset: number,
  ) {
    const [count, rows] = await Promise.all([
      this.userModel.countDocuments(filter).exec(),
      this.userModel.find(filter).skip(offset).limit(limit).exec(),
    ]);

    return { count, rows };
  }

  updateByIdField(id: string, data: Partial<User>, session?: ClientSession) {
    return this.userModel
      .findOneAndUpdate({ id }, data, { new: true, session })
      .exec();
  }

  softDeleteByIdField(id: string, session?: ClientSession) {
    return this.userModel
      .findOneAndUpdate(
        { id },
        { deletedAt: new Date() },
        { new: true, session },
      )
      .exec();
  }

  async findMostActiveUsers(dto: GetMostActiveUsersDto) {
    const { ageFrom = 1, ageTo = 100, page = 1, limit = 10 } = dto;
    const offset = (page - 1) * limit;

    const [result] = await this.userModel.aggregate([
      {
        $match: {
          deletedAt: null,
          age: { $gte: ageFrom, $lte: ageTo },
          description: { $exists: true, $nin: ['', null] },
        },
      },
      {
        $lookup: {
          from: 'avatars',
          let: { userId: '$id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$userId', '$$userId'] },
                    { $eq: ['$deletedAt', null] },
                  ],
                },
              },
            },
            { $sort: { uploadedAt: -1 } },
            {
              $group: {
                _id: '$userId',
                activeAvatarsCount: { $sum: 1 },
                latestAvatar: { $first: '$$ROOT' },
              },
            },
          ],
          as: 'avatarStats',
        },
      },
      {
        $addFields: {
          avatarStats: { $arrayElemAt: ['$avatarStats', 0] },
        },
      },
      {
        $match: {
          'avatarStats.activeAvatarsCount': { $gt: 2 },
        },
      },
      {
        $sort: {
          'avatarStats.activeAvatarsCount': -1,
          'avatarStats.latestAvatar.uploadedAt': -1,
          createdAt: -1,
        },
      },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          users: [
            { $skip: offset },
            { $limit: limit },
            {
              $project: {
                _id: 0,
                id: 1,
                login: 1,
                email: 1,
                age: 1,
                description: 1,
                roles: 1,
                createdAt: 1,
                updatedAt: 1,
                activeAvatarsCount: '$avatarStats.activeAvatarsCount',
                latestAvatar: {
                  id: '$avatarStats.latestAvatar.id',
                  userId: '$avatarStats.latestAvatar.userId',
                  path: '$avatarStats.latestAvatar.path',
                  uploadedAt: '$avatarStats.latestAvatar.uploadedAt',
                  createdAt: '$avatarStats.latestAvatar.createdAt',
                  updatedAt: '$avatarStats.latestAvatar.updatedAt',
                },
              },
            },
          ],
        },
      },
    ]);

    const total = result?.metadata?.[0]?.total ?? 0;
    const users = result?.users ?? [];

    return { total, users };
  }
}
