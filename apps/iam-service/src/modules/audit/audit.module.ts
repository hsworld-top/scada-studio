import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';

/**
 * 审计模块
 * 负责记录系统中的各种操作日志，用于安全审计和问题追踪
 */
@Module({
  imports: [],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
