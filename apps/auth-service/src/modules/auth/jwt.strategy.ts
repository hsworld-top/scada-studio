import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { RedisLibService } from '@app/redis-lib';
import { AppLogger } from '@app/logger-lib';

/**
 * JwtStrategy 用于处理 JWT 的验证逻辑，包括 token 的有效性和黑名单校验。
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  /**
   * 构造函数，配置 JWT 策略参数，并注入依赖服务。
   * @param configService 配置服务，用于获取 JWT 密钥
   * @param redisService Redis 服务，用于 token 黑名单校验
   * @param logger 日志服务
   */
  constructor(
    configService: ConfigService,
    private redisService: RedisLibService,
    private logger: AppLogger,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // 从请求头获取 token
      ignoreExpiration: false, // 不忽略过期
      secretOrKey: configService.get('JWT_SECRET') || 'testJWT', // JWT 密钥
      passReqToCallback: true, // 回调中传递 req
    });
    this.logger.setContext(JwtStrategy.name);
  }

  /**
   * 校验 JWT，有效且未被拉黑才通过。
   * @param req 请求对象
   * @param payload JWT 载荷
   * @returns 用户信息
   * @throws UnauthorizedException token 无效或被拉黑时抛出
   */
  async validate(req: any, payload: any) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (!token) {
      this.logger.warn('No token found in request during JWT validation.');
      throw new UnauthorizedException('No token found in request');
    }

    const isBlacklisted = await this.redisService.get(`blacklist:${token}`);
    if (isBlacklisted) {
      this.logger.warn(
        `Attempted to use a blacklisted token for user: ${payload.username}`,
      );
      throw new UnauthorizedException('Token has been invalidated.');
    }
    return {
      userId: payload.sub,
      username: payload.username,
      roles: payload.roles,
    };
  }
}
