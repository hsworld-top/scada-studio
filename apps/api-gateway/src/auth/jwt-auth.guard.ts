import {
  Injectable,
  ExecutionContext,
  Logger,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, catchError, of } from 'rxjs';

/**
 * JWT认证守卫
 * 使用Passport JWT策略进行本地JWT验证，并通过Auth Service进行远程验证
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private reflector: Reflector,
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 公共接口，无需认证
    const publicPaths = [
      '/api/auth/login',
      '/api/auth/sso',
      '/api/auth/refresh',
      '/api/auth/captcha',
      '/api/auth/captcha-config',
      '/api/auth/public-key',
      '/health',
      '/metrics',
    ];

    // 检查是否为公共路径
    if (publicPaths.some((path) => request.path.startsWith(path))) {
      return true;
    }

    try {
      // 1. 本地JWT验证（签名、过期时间等）
      const localValid = await super.canActivate(context);
      if (!localValid) {
        this.logger.warn(`JWT本地验证失败 - 路径: ${request.path}`);
        throw new UnauthorizedException('JWT本地验证失败');
      }

      // 2. 远程验证（黑名单、用户状态、租户状态等）
      const token = this.extractTokenFromRequest(request);
      if (!token) {
        this.logger.warn(`无法提取token - 路径: ${request.path}`);
        throw new UnauthorizedException('无法提取token');
      }
      // 将token存储到request.user中
      request.user.access_token = token;

      const remoteValidation = await this.validateTokenRemotely(
        token,
        request.path,
      );
      if (!remoteValidation.valid) {
        this.logger.warn(
          `远程验证失败 - 路径: ${request.path}, 原因: ${remoteValidation.reason}`,
        );
        // 抛出包含auth-service错误信息的异常
        throw new UnauthorizedException(
          remoteValidation.reason || '远程验证失败',
        );
      }

      // 3. 更新请求对象中的用户信息（使用最新的用户数据）
      if (remoteValidation.user) {
        request.user = {
          ...request.user,
          ...remoteValidation.user,
        };
      }

      this.logger.debug(
        `JWT验证成功 - 用户ID: ${request.user?.userId}, 路径: ${request.path}`,
      );
      return true;
    } catch (error) {
      this.logger.error(`JWT验证异常 - 路径: ${request.path}:`, error.message);

      // 如果是我们自己抛出的异常，直接重新抛出
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      // 其他异常统一处理
      throw new UnauthorizedException(`JWT验证异常: ${error.message}`);
    }
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    if (err || !user) {
      this.logger.warn(
        `JWT验证失败 - 路径: ${request.path}, 错误: ${err?.message || info?.message}`,
      );
      throw err || new UnauthorizedException(info?.message || 'JWT验证失败');
    }

    return user;
  }

  /**
   * 从请求中提取JWT token
   */
  private extractTokenFromRequest(request: any): string | null {
    const authHeader = request.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.split(' ')[1];
  }

  /**
   * 远程验证token
   */
  private async validateTokenRemotely(
    token: string,
    path: string,
  ): Promise<{
    valid: boolean;
    reason?: string;
    user?: any;
  }> {
    try {
      // 调用auth service验证token
      const result = await firstValueFrom(
        this.authClient.send('auth.validateToken', { token }).pipe(
          timeout(3000), // 3秒超时，避免阻塞太久
          catchError((error) => {
            this.logger.error(
              `Auth service调用失败 - 路径: ${path}:`,
              error.message,
            );
            // 网络异常时返回null，表示验证失败
            return of(null);
          }),
        ),
      );

      // 网络异常或服务不可用
      if (!result) {
        return {
          valid: false,
          reason: 'Auth service不可用',
        };
      }

      // 验证成功
      if (result.code === 0 && result.data?.valid) {
        return {
          valid: true,
          user: result.data.user,
        };
      }

      // 验证失败，直接使用auth-service返回的错误信息
      return {
        valid: false,
        reason: result.msg || '验证失败',
      };
    } catch (error) {
      this.logger.error(`远程验证异常 - 路径: ${path}:`, error.message);
      return {
        valid: false,
        reason: `验证异常: ${error.message}`,
      };
    }
  }
}
