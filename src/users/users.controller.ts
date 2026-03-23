import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { GetMostActiveUsersDto } from './dto/get-most-active-users.dto';
import { GetUsersDto } from './dto/get-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from './schemas/user.schema';
import { UserDecorator } from '../common/user.decorator';

@ApiTags('Пользователи')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @ApiOperation({ summary: 'Создание пользователя' })
  @ApiResponse({ status: 200, type: User })
  @Post()
  create(@Body() userDto: CreateUserDto) {
    return this.usersService.createUser(userDto);
  }

  @ApiOperation({ summary: 'Получение всех пользователей' })
  @ApiResponse({ status: 200, type: [User] })
  @Get()
  @UseGuards(JwtAuthGuard)
  getAll(@Query() getUsersDto: GetUsersDto) {
    return this.usersService.getAllUsers(getUsersDto);
  }

  @ApiOperation({ summary: 'Получение самых активных пользователей' })
  @ApiResponse({ status: 200 })
  @Get('most-active')
  @UseGuards(JwtAuthGuard)
  getMostActiveUsers(@Query() getMostActiveUsersDto: GetMostActiveUsersDto) {
    return this.usersService.getMostActiveUsers(getMostActiveUsersDto);
  }

  @ApiOperation({ summary: 'Получение информации о себе' })
  @ApiResponse({ status: 200 })
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getCurrentUser(@UserDecorator('id') userId: string) {
    return this.usersService.getUserById(userId);
  }

  @ApiOperation({ summary: 'Обновление пользователя' })
  @ApiResponse({ status: 200 })
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateUser(id, updateUserDto);
  }

  @ApiOperation({ summary: 'Удаление пользователя' })
  @ApiResponse({ status: 200 })
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.softDeleteUser(id);
  }
}
