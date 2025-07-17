import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PlatformUser } from '../platform-user/platform-user.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { nanoid } from 'nanoid';
import { UserStatus } from '@app/shared-dto-lib';
import * as bcrypt from 'bcrypt';
/**
 * 平台认证服务
 * 负责平台用户的登录、认证、token 相关逻辑
 */
@Injectable()
export class PlatformAuthService {
  /**
   * 构造函数，注入依赖
   */
  constructor(
    @InjectRepository(PlatformUser)
    private readonly userRepo: Repository<PlatformUser>,
    private readonly jwtService: JwtService,
  ) {}

  async login(username: string, password: string) {
    const user = await this.userRepo.findOne({ where: { username } });
    if (!user) {
      throw new Error('account_not_found');
    }

    if (!this.verifyPassword(password, user.passwordHash)) {
      throw new Error('password_incorrect');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new Error('account_disabled');
    }

    // 生成新的 sessionId
    const sessionId = nanoid();

    await this.userRepo.update(
      { id: user.id },
      { currentSessionId: sessionId },
    );

    // 签发 JWT
    const token = this.jwtService.sign(
      {
        userId: user.id,
        scope: 'platform',
        sessionId,
      },
      {
        expiresIn: '10m', //10分钟
        secret: process.env.JWT_SECRET,
      },
    );

    return { token };
  }

  async logout(userId: string) {
    await this.userRepo.update({ id: userId }, { currentSessionId: '' });
    return { message: '退出成功' };
  }

  verifyPassword(input: string, hash: string) {
    // 简单示例，生产请用 bcrypt
    if (!input || !hash) {
      return false;
    }
    // 使用 bcrypt 验证密码
    try {
      return bcrypt.compareSync(input, hash);
    } catch (error) {
      console.error('Password verification failed:', error);
      return false;
    }
  }
}
