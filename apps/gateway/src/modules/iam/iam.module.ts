import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { RoleModule } from './role/role.module';
import { GroupModule } from './group/group.module';
import { PermissionModule } from './permission/permission.module';

/**
 * IAM模块
 * @description 整合所有IAM相关的子模块，提供完整的身份和访问管理功能
 */
@Module({
  imports: [AuthModule, UserModule, RoleModule, GroupModule, PermissionModule],
  exports: [AuthModule, UserModule, RoleModule, GroupModule, PermissionModule],
})
export class IamModule {}
