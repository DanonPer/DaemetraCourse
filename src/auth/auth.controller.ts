import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { RefreshTokenDto } from './dto/RefreshTokenDto';

@ApiTags('Авторизация')
@Controller('auth')
export class AuthController {

    constructor (private authServise: AuthService){}

    @Post('/login')
    login(@Body() userDto: CreateUserDto){
        return this.authServise.login(userDto)
    }

    @Post('/registration')
    registration(@Body() userDto: CreateUserDto){
        return this.authServise.registration(userDto)
    }

    @Post('/refresh')
    refresh(@Body() refreshTokenDto: RefreshTokenDto) {
        return this.authServise.refresh(refreshTokenDto.refreshToken);
    }
}
