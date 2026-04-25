import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface JwtPayload {
  id: string;
  login: string;
  roles: string[];
}

@Injectable()
export class NotificationAuthService {
  constructor(private readonly jwtService: JwtService) {}

  verifyAuthorizationHeader(authHeader?: string | string[]): string {
    const authorization = Array.isArray(authHeader)
      ? authHeader[0]
      : authHeader;

    if (!authorization) {
      throw new UnauthorizedException('Authorization header is missing');
    }

    const [bearer, token] = authorization.split(' ');

    if (bearer !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization header');
    }

    const payload = this.jwtService.verify<JwtPayload>(token);

    if (!payload.id) {
      throw new UnauthorizedException('Token payload does not contain user id');
    }

    return payload.id;
  }
}
