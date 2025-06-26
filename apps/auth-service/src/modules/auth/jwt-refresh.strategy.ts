import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { I18nService } from 'nestjs-i18n';

/**
 * JwtRefreshStrategy 用于验证 Refresh Token。
 */
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private readonly i18n: I18nService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
      passReqToCallback: true, // 将 req 传递到 validate 回调
    });
  }

  /**
   * 验证 refresh token 的 payload。
   * @param req - express 请求对象
   * @param payload - JWT payload
   * @returns 验证通过的用户信息和 refresh token
   */
  validate(req: Request, payload: any): any {
    const refreshToken = req.get('authorization')?.replace('Bearer', '').trim();
    if (!refreshToken) {
      throw new UnauthorizedException(this.i18n.t('common.no_refresh_token'));
    }
    // 返回包含原始 refresh token 的 payload
    return { ...payload, refreshToken };
  }
}
