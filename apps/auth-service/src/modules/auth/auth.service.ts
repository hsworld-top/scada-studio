import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import { RedisLibService } from '@app/redis-lib';
import { User } from '../user/entities/user.entity';
import { AppLogger } from '@app/logger-lib';

/**
 * AuthService 提供认证相关的服务，包括用户校验、登录、登出等功能。
 */
@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    @Inject(forwardRef(() => RedisLibService)) // 使用 forwardRef 解决循环依赖
    private redisService: RedisLibService,
    private readonly logger: AppLogger, // 注入日志服务
  ) {}

  /**
   * 校验用户身份，用户名和密码是否匹配。
   * @param username 用户名
   * @param pass 密码
   * @returns 匹配成功返回用户信息，否则返回 null
   */
  async validateUser(
    username: string,
    pass: string,
  ): Promise<Partial<User> | null> {
    const user = await this.userService.findOneByUsername(username);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { ...result } = user;
      return result;
    }
    return null;
  }

  /**
   * 用户登录，生成 JWT token。
   * @param user 用户信息
   * @returns 包含 access_token 的对象
   */
  login(user: Partial<User>) {
    const payload = {
      username: user.username,
      sub: user.id?.toString(),
      roles: user.roles?.map((role) => role.name),
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  /**
   * 用户登出，将 token 加入黑名单，设置过期时间。
   * @param token 需要作废的 JWT token
   */
  async logout(token: string): Promise<void> {
    try {
      const decoded = this.jwtService.decode(token);
      if (!decoded || !decoded.exp) return;

      const expiration = decoded.exp;
      const now = Math.floor(Date.now() / 1000);
      const ttl = expiration - now;

      if (ttl > 0) {
        // 将 token 加入 Redis 黑名单，设置有效期为 token 剩余时间
        await this.redisService.set(`blacklist:${token}`, '1', ttl);
      }
    } catch (error) {
      // 登出过程中出现异常，记录错误日志
      this.logger.error('Error during logout process', error);
    }
  }
}
