import { Module } from '@nestjs/common';
import { PermissionController } from './permission.controller';
import { PermissionService } from './permission.service';
import { IamSharedModule } from '../../share/iam-shared.module';
/**
 * 权限管理模块
 * @description 处理权限相关的HTTP请求，转发到IAM服务
 */
@Module({
  imports: [IamSharedModule],
  controllers: [PermissionController],
  providers: [PermissionService],
  exports: [PermissionService],
})
export class PermissionModule {}
