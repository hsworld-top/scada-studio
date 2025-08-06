import { Module } from '@nestjs/common';
import { RoleController } from './role.controller';
import { RoleService } from './role.service';
import { IamSharedModule } from '../../share/iam-shared.module';

/**
 * 角色管理模块
 * @description 处理角色相关的HTTP请求，转发到IAM服务
 */
@Module({
  imports: [IamSharedModule],
  controllers: [RoleController],
  providers: [RoleService],
  exports: [RoleService],
})
export class RoleModule {}
