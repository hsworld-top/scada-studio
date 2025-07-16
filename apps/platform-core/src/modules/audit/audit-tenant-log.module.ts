import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditTenantLog } from './entities/audit-tenant-log.entity';
import { AuditTenantLogService } from './audit-tenant-log.service';

/**
 * 租户操作审计日志模块
 * 负责审计日志实体、服务的依赖注入与导出
 */
@Module({
  imports: [TypeOrmModule.forFeature([AuditTenantLog])],
  providers: [AuditTenantLogService],
  exports: [AuditTenantLogService],
})
export class AuditTenantLogModule {}
