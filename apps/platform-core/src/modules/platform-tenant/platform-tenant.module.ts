import { Module } from '@nestjs/common';
import { AuditTenantLogModule } from '../audit/audit-tenant-log.module';
import { TenantService } from './platform-tenant.service';
import { TenantController } from './platform-tenant.controller';

/**
 * 租户模块
 * 负责租户相关的依赖注入、服务与控制器注册
 */
@Module({
  imports: [AuditTenantLogModule],
  providers: [TenantService],
  controllers: [TenantController],
  exports: [TenantService],
})
export class TenantModule {}
