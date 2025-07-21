import { Module } from '@nestjs/common'; // 导入 Module 装饰器
import { PermissionController } from './permission.controller'; // 导入 PermissionController
import { PermissionService } from './permission.service'; // 导入 PermissionService
import { CasbinModule } from '../casbin/casbin.module'; // 导入 CasbinModule

@Module({
  imports: [CasbinModule],
  controllers: [PermissionController],
  providers: [PermissionService],
  exports: [PermissionService],
})
export class PermissionModule {}
