import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { IamSharedModule } from '../../share/iam-shared.module';

/**
 * 认证模块
 * @description 处理认证相关的HTTP请求，转发到IAM服务
 */
@Module({
  imports: [IamSharedModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
