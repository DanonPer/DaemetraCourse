import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UserDecorator } from '../common/user.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { GetMostActiveUsersDto } from './dto/get-most-active-users.dto';
import { GetUsersDto } from './dto/get-users.dto';
import { TransferMoneyDto } from './dto/transfer-money.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './schemas/user.schema';
import { UsersService } from './users.service';

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

  @ApiOperation({ summary: 'Переводить деньги между пользователями' })
  @ApiResponse({ status: 200 })
  @Post('transfer')
  @UseGuards(JwtAuthGuard)
  transferMoney(@Body() transferMoneyDto: TransferMoneyDto) {
    return this.usersService.transferMoney(transferMoneyDto);
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

  @ApiOperation({ summary: 'Получение пользователя по id' })
  @ApiResponse({ status: 200, type: User })
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.getActiveUserById(id);
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
