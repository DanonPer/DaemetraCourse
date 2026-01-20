import { Body, Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { GetUsersDto } from './dto/get-users.dto';

@Controller('users')
export class UsersController {

    constructor(private usersService: UsersService){}

    @Post()
    create(@Body() userDto: CreateUserDto){
        return this.usersService.createUser(userDto);
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    getAll(@Query() getUsersDto: GetUsersDto) {
    return this.usersService.getAllUsers(getUsersDto);
  }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    getCurrentUser(@Request() req) {
        return this.usersService.getUserById(req.user.id);
    }
}
