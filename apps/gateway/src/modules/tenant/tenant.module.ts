import { Module } from '@nestjs/common';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';
import { TenantSharedModule } from '../share/tenant-shared.module';
import { IamSharedModule } from '../share/iam-shared.module';

/**
 * 租户管理模块
 * @description 处理租户相关的HTTP请求，转发到平台核心服务
 */
@Module({
  imports: [TenantSharedModule, IamSharedModule],
  controllers: [TenantController],
  providers: [TenantService],
  exports: [TenantService],
})
export class TenantModule {}
