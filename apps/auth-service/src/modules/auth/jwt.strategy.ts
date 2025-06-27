import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { RedisLibService } from '@app/redis-lib';
import { AppLogger } from '@app/logger-lib';
import { I18nService } from 'nestjs-i18n';

/**
 * JwtStrategy 用于处理 JWT 的验证逻辑，包括 token 的有效性和黑名单校验。
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  /**
   * 构造函数，配置 JWT 策略参数，并注入依赖服务。
   * @param redisService Redis 服务，用于 token 黑名单校验
   * @param logger 日志服务
   * @param i18n 国际化服务
   */
  constructor(
    private redisService: RedisLibService,
    private logger: AppLogger,
    private readonly i18n: I18nService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
      passReqToCallback: true,
    });
    this.logger.setContext(JwtStrategy.name);
  }

  /**
   * 校验 JWT，有效且未被拉黑才通过。
   * @param req 请求对象
   * @param payload JWT 载荷
   * @returns 用户信息，包含租户信息
   * @throws UnauthorizedException token 无效或被拉黑时抛出
   */
  async validate(req: any, payload: any) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (!token) {
      this.logger.warn('No token found in request during JWT validation.');
      throw new UnauthorizedException(this.i18n.t('common.jwt_no_token'));
    }

    const isBlacklisted = await this.redisService.get(`blacklist:${token}`);
    if (isBlacklisted) {
      this.logger.warn(
        `Attempted to use a blacklisted token for user: ${payload.username}`,
      );
      throw new UnauthorizedException(
        this.i18n.t('common.jwt_token_invalidated'),
      );
    }

    if (!payload.tenantId) {
      this.logger.error('JWT payload is missing tenantId.', '', 'JwtStrategy');
      throw new UnauthorizedException(this.i18n.t('common.jwt_missing_tenant'));
    }

    return {
      userId: payload.sub,
      username: payload.username,
      roles: payload.roles,
      tenantId: payload.tenantId,
      tenantSlug: payload.tenantSlug,
    };
  }
}
