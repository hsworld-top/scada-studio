import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditTenantLog } from './entities/audit-tenant-log.entity';

/**
 * 租户操作审计日志服务
 * 负责记录和管理租户相关的操作日志
 */
@Injectable()
export class AuditTenantLogService {
  /**
   * 构造函数，注入依赖
   */
  constructor(
    @InjectRepository(AuditTenantLog)
    private readonly repo: Repository<AuditTenantLog>,
  ) {}

  /**
   * 记录审计日志
   * @param log 审计日志数据
   */
  async audit(log: Partial<AuditTenantLog>) {
    await this.repo.save(this.repo.create(log));
  }
}
