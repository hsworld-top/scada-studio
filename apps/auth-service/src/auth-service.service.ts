import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AuthServiceService {
  private readonly logger = new Logger(AuthServiceService.name);

  getHello(): string {
    return 'Hello World!';
  }

  createAdmin(createAdminDto: any) {
    this.logger.error(`新用户注册：${createAdminDto.username}`);
    return { success: true, message: '创建管理员用户成功' };
  }
}
