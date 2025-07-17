import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlatformUser } from '../modules/platform-user/platform-user.entity';
/**
 * 平台会话守卫
 * 用于保护需要登录态的接口，校验用户会话有效性
 */
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
    const data = context.switchToRpc().getData();
    if (!data || !data.userId) {
      throw new UnauthorizedException('invalid_user');
    }
    const user = await this.userRepo.findOne({ where: { id: data.userId } });
    if (!user) throw new UnauthorizedException('invalid_user');

    if (data.sessionId !== user.currentSessionId) {
      throw new UnauthorizedException('invalid_session');
    }

    data.user = user;

    return true;
  }
}
