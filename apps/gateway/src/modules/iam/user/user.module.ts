import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { IamSharedModule } from '../../share/iam-shared.module';
/**
 * 用户管理模块
 * @description 处理用户相关的HTTP请求，转发到IAM服务
 */
@Module({
  imports: [IamSharedModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
