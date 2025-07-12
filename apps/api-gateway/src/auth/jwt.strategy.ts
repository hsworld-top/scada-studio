import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';

export interface JwtPayload {
  sub: string; // user id
  email: string;
  username: string;
  roles: string[];
  permissions: string[];
  tenantId?: string;
  sessionId?: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'default-secret-key-for-dev',
    });
  }

  validate(payload: JwtPayload) {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // 返回用户信息，这将被设置到 request.user 中
    return {
      userId: payload.sub,
      email: payload.email,
      username: payload.username,
      roles: payload.roles || [],
      permissions: payload.permissions || [],
      tenantId: payload.tenantId,
      sessionId: payload.sessionId,
    };
  }
}
