import { Injectable } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, RoleDocument } from './schemas/role.schema';

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role.name)
    private roleRepository: Model<RoleDocument>,
  ) {}

  async createRole(dto: CreateRoleDto) {
    return this.roleRepository.create(dto);
  }

  async getRoleByValue(value: string) {
    return this.roleRepository.findOne({ value });
  }
}
