import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcryptjs'
import { User } from 'src/users/users.model';

@Injectable()
export class AuthService {

    constructor(private userService: UsersService,
                private jwtService: JwtService){}

    async login(userDto: CreateUserDto){
        const user = await this.validateUser(userDto)
        return this.generateToken(user)
    }

    async registration(userDto: CreateUserDto){
        const candidate = await this.userService.getUserByLogin(userDto.login);
        if(candidate){
            throw new HttpException('Пользователь с таким login существует', HttpStatus.BAD_REQUEST)
        }
        const hashPassword = await bcrypt.hash(userDto.password,5);
        const user = await this.userService.createUser({...userDto, password: hashPassword})
        return this.generateToken(user)
    }

    async refresh(refreshToken: string) {
        try {
            const userData = this.jwtService.verify(refreshToken, {
                secret: process.env.PRIVATE_KEY || 'SECRET'
            });

            const user = await this.userService.getUserByLogin(userData.login);
            if (!user) {
                throw new UnauthorizedException({ message: 'Пользователь не найден' });
            }

            return this.generateToken(user);
        } catch (e) {
            throw new UnauthorizedException({ message: 'Невалидный refresh токен' });
        }
    }

    private async generateToken(user: User) {
        const payload = { 
            login: user.get('login'), 
            id: user.get('id'), 
            roles: user.roles 
        };
        
        const accessToken = this.jwtService.sign(payload, {
            expiresIn: '15m'
        });
        const refreshToken = this.jwtService.sign(payload, {
            expiresIn: '7d'
        });
        
        return {
            accessToken,
            refreshToken,
            user: {
                id: user.get('id'),
                login: user.get('login'),
                roles: user.roles
            }
        };
    }

    private async validateUser(userDto: CreateUserDto) {
        const user = await this.userService.getUserByLogin(userDto.login);
        if (!user) {
            throw new UnauthorizedException({message: 'Некорректный логин или пароль'})
        }
        const passwordEquals = await bcrypt.compare(userDto.password, user.get('password'));
        if (user && passwordEquals) {
            return user;
        }
        throw new UnauthorizedException({message: 'Некорректный логин или пароль'})
    }
}
