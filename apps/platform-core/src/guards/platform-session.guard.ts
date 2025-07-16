import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Global,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlatformUser } from '../modules/platform-user/platform-user.entity';
/**
 * 平台会话守卫
 * 用于保护需要登录态的接口，校验用户会话有效性
 */
@Global()
@Injectable()
export class PlatformSessionGuard implements CanActivate {
  /**
   * 构造函数，注入依赖
   */
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(PlatformUser)
    private readonly userRepo: Repository<PlatformUser>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');

    if (!token) throw new UnauthorizedException('缺少 Token');

    const payload = this.jwtService.verify(token);

    if (payload.scope !== 'platform') {
      throw new UnauthorizedException('Token 非平台管理员');
    }

    const user = await this.userRepo.findOne({ where: { id: payload.userId } });
    if (!user) throw new UnauthorizedException('无效用户');

    if (payload.sessionId !== user.currentSessionId) {
      throw new UnauthorizedException('该账号已在其他设备登录');
    }

    req.user = user;

    return true;
  }
}
