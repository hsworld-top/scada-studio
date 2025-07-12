import {
  Injectable,
  ExecutionContext,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

/**
 * JWT认证守卫
 * 使用Passport JWT策略进行本地JWT验证
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    // 公共接口，无需认证
    const publicPaths = [
      '/api/auth/login',
      '/api/auth/sso',
      '/api/auth/refresh',
      '/api/auth/captcha',
      '/api/auth/captcha-config',
      '/health',
      '/metrics',
    ];

    // 检查是否为公共路径
    if (publicPaths.some((path) => request.path.startsWith(path))) {
      return true;
    }

    // 调用父类的canActivate方法，使用JWT策略进行验证
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    if (err || !user) {
      this.logger.warn(
        `JWT验证失败 - 路径: ${request.path}, 错误: ${err?.message || info?.message}`,
      );
      throw err || new UnauthorizedException('JWT验证失败');
    }

    this.logger.debug(
      `JWT验证成功 - 用户ID: ${user.userId}, 路径: ${request.path}`,
    );
    return user;
  }
}
