import { HttpException, HttpStatus, Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcryptjs'
import { User } from 'src/users/users.model';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {

    constructor(
        private userService: UsersService,
        private tokenService: TokenService
    ){}

    async login(userDto: CreateUserDto){
        const user = await this.validateUser(userDto);
        const tokens = await this.tokenService.generateAndSaveTokens(user);
        return tokens;
    }

    async registration(userDto: CreateUserDto){
        const candidate = await this.userService.getUserByLogin(userDto.login);
        if(candidate){
            throw new HttpException('Пользователь с таким login существует', HttpStatus.BAD_REQUEST)
        }
        const hashPassword = await bcrypt.hash(userDto.password,5);
        const user = await this.userService.createUser({...userDto, password: hashPassword});
        const tokens = await this.tokenService.generateAndSaveTokens(user);
        return tokens;
    }

    async refresh(refreshToken: string) {
        return this.tokenService.refresh(refreshToken);
    }

    private async validateUser(userDto: CreateUserDto) {
        const user = await this.userService.getUserByLogin(userDto.login);
        if (!user) {
            throw new UnauthorizedException({message: 'Некорректный логин или пароль'})
        }
        const passwordEquals = await bcrypt.compare(userDto.password, user.get('password'));
        if (!passwordEquals) {
            throw new UnauthorizedException({message: 'Некорректный логин или пароль'});
        }       
        return user;
    }
}