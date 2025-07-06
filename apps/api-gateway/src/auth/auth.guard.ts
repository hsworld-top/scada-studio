import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';

/**
 * 全局认证守卫
 * 负责校验所有API请求的token
 */
@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 公共接口，无需认证
    const publicPaths = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/captcha',
      '/health',
      '/metrics',
    ];

    if (publicPaths.some((path) => request.path.startsWith(path))) {
      return true;
    }

    const authHeader = request.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      this.logger.warn(`请求路径 ${request.path} 缺少认证Token`);
      throw new UnauthorizedException('缺少认证Token');
    }

    const token = authHeader.split(' ')[1];

    try {
      // 调用 auth-service 验证 token
      const result = await firstValueFrom(
        this.authClient.send('auth.validateToken', { token }).pipe(
          timeout(5000), // 5秒超时
          catchError((error) => {
            this.logger.error('Token验证失败', error);
            throw new UnauthorizedException('Token验证失败');
          }),
        ),
      );

      if (result && result.valid) {
        // 将用户信息附加到请求对象
        request.user = result.user;
        return true;
      } else {
        throw new UnauthorizedException('无效的Token');
      }
    } catch (error) {
      this.logger.error('Token验证异常', error);
      throw new UnauthorizedException('Token验证失败');
    }
  }
}
