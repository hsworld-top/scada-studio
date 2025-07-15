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
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    // 在生产环境中检查密钥强度
    if (process.env.NODE_ENV === 'production') {
      if (jwtSecret === 'default-secret-key-for-dev') {
        throw new Error('Production environment cannot use default JWT secret');
      }
      if (jwtSecret.length < 32) {
        throw new Error(
          'JWT secret must be at least 32 characters in production',
        );
      }
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  validate(payload: JwtPayload) {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // 验证token载荷的完整性
    if (!payload.tenantId) {
      throw new UnauthorizedException('Token missing tenant information');
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
