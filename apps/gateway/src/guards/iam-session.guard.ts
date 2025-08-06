import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Global,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
/**
 * IAM会话守卫
 * 用于保护需要登录态的接口，校验用户会话有效性
 */
@Global()
@Injectable()
export class IAMSessionGuard implements CanActivate {
  /**
   * 构造函数，注入依赖
   */
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['authorization']?.split(' ')[1] || '';

    if (!token) throw new UnauthorizedException('no_token');

    const payload = this.jwtService.verify(token);

    request.user = payload;

    return true;
  }
}
