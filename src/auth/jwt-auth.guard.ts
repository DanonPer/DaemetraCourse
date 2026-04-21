import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private jwtService: JwtService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const req = context.switchToHttp().getRequest();

    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        this.logger.warn(
          `Авторизация отклонена: отсутствует заголовок Authorization, path=${req.url}`,
        );
        throw new UnauthorizedException({
          message: 'Пользователь не авторизован',
        });
      }

      const [bearer, token] = authHeader.split(' ');

      if (bearer !== 'Bearer' || !token) {
        this.logger.warn(
          `Авторизация отклонена: некорректный Bearer token, path=${req.url}`,
        );
        throw new UnauthorizedException({
          message: 'Пользователь не авторизован',
        });
      }

      const user = this.jwtService.verify(token);
      req.user = user;

      this.logger.debug(
        `Пользователь авторизован: userId=${user.id}, path=${req.url}`,
      );

      return true;
    } catch (e) {
      if (e instanceof Error && e.name === 'TokenExpiredError') {
        this.logger.warn(
          `Авторизация отклонена: access token истёк, path=${req.url}`,
        );
      } else {
        const message = e instanceof Error ? e.message : 'Неизвестная ошибка';
        this.logger.warn(`Авторизация отклонена: ${message}, path=${req.url}`);
      }

      throw new UnauthorizedException({
        message: 'Пользователь не авторизован',
      });
    }
  }
}
