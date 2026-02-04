import { HttpException, HttpStatus, Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcryptjs'
import { User } from 'src/users/users.model';
import { ConfigService } from '@nestjs/config';
import { RefreshToken } from './refresh-token.model';
import { Op } from 'sequelize';

@Injectable()
export class AuthService {

    constructor(
        private userService: UsersService,
        private jwtService: JwtService,
        private configService: ConfigService,
        @InjectModel(RefreshToken)
        private refreshTokenModel: typeof RefreshToken
    ){}

    async login(userDto: CreateUserDto){
        const user = await this.validateUser(userDto);
        const tokens = await this.generateAndSaveTokens(user);
        return tokens;
    }

    async registration(userDto: CreateUserDto){
        const candidate = await this.userService.getUserByLogin(userDto.login);
        if(candidate){
            throw new HttpException('Пользователь с таким login существует', HttpStatus.BAD_REQUEST)
        }
        const hashPassword = await bcrypt.hash(userDto.password,5);
        const user = await this.userService.createUser({...userDto, password: hashPassword});
        const tokens = await this.generateAndSaveTokens(user);
        return tokens;
    }

    async refresh(refreshToken: string) {
        if (!refreshToken) {
            throw new BadRequestException('Refresh токен не предоставлен');
        }
        try {
            const userData = this.jwtService.verify(refreshToken, {
                secret: this.configService.get<string>('PRIVATE_KEY')
            });

            const user = await this.userService.getUserByLogin(userData.login);
            if (!user) {
                throw new NotFoundException('Пользователь не найден');
            }

            const tokenRecord = await this.refreshTokenModel.findOne({
                where: { 
                    userId: user.id,
                    token: refreshToken
                }
            });

            if (!tokenRecord) {
                throw new UnauthorizedException('Токен не найден или уже использован');
            }

            if (new Date() > tokenRecord.expiresAt) {
                await tokenRecord.destroy();
                throw new UnauthorizedException('Refresh токен истек');
            }
            await tokenRecord.destroy();
            const newTokens = await this.generateAndSaveTokens(user);
            return newTokens;
        } catch (e) {
            throw new UnauthorizedException({ message: 'Refresh токен истек или невалиден' });
        }
    }

    private async generateAndSaveTokens(user: User) {
        const tokens = await this.generateToken(user);
        await this.saveRefreshToken(user.id, tokens.refreshToken);
        return tokens;
    }

private async generateToken(user: User) {
    const payload = { 
        login: user.get('login'), 
        id: user.get('id'), 
        roles: user.roles 
    };
    
    const accessTokenExpiresIn = this.configService.get<string>('ACCESS_TOKEN_EXPIRES_IN', '15m');
    const refreshTokenExpiresIn = this.configService.get<string>('REFRESH_TOKEN_EXPIRES_IN', '7d');
    const refreshTokenDbExpiresDays = this.configService.get<number>('REFRESH_TOKEN_DB_EXPIRES_DAYS', 7);
    
    const accessToken = this.jwtService.sign(payload, {
        expiresIn: accessTokenExpiresIn
    } as any);
    
    const refreshToken = this.jwtService.sign(payload, {
        expiresIn: refreshTokenExpiresIn
    } as any);
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshTokenDbExpiresDays);
    
    return {
        accessToken,
        refreshToken,
        expiresAt,
        user: {
            id: user.get('id'),
            login: user.get('login'),
            roles: user.roles
        }
    };
    }

    private async saveRefreshToken(userId: string, refreshToken: string) {
        const expiresDays = this.configService.get<number>('REFRESH_TOKEN_DB_EXPIRES_DAYS', 7);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiresDays);
        
        await this.refreshTokenModel.create({
            userId,
            token: refreshToken,
            expiresAt
        });
        await this.cleanupOldTokens(userId);
    }

    private async cleanupOldTokens(userId: string) {
        const cleanupDays = this.configService.get<number>('OLD_TOKENS_CLEANUP_DAYS', 1);
        const cleanupDate = new Date();
        cleanupDate.setDate(cleanupDate.getDate() - cleanupDays);
        
        await this.refreshTokenModel.destroy({
            where: {
                userId,
                expiresAt: { [Op.lt]: cleanupDate }
            }
        });
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