import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AuthServiceService {
  private readonly logger = new Logger(AuthServiceService.name);

  getHello(): string {
    return 'Hello World!';
  }

  async login(username: string, password: string) {
    this.logger.log(`用户 ${username} 尝试登录`);

    try {
      // 模拟登录逻辑
      if (username === 'admin' && password === '123456') {
        this.logger.log(`用户 ${username} 登录成功`);
        return { success: true, message: '登录成功' };
      }

      this.logger.warn(`用户 ${username} 登录失败：密码错误`);
      return { success: false, message: '用户名或密码错误' };
    } catch (error: any) {
      this.logger.error(
        `用户 ${username} 登录异常：${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async register(username: string, password: string) {
    this.logger.log(`新用户注册：${username}`);

    try {
      // 模拟注册逻辑
      this.logger.log(`用户 ${username} 注册成功`);
      return { success: true, message: '注册成功' };
    } catch (error) {
      this.logger.error(
        `用户 ${username} 注册失败：${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
