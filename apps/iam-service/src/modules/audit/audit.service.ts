import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { AppLogger } from '@app/logger-lib';

/**
 * 审计服务接口
 */
export interface AuditData {
  userId?: number;
  tenantId?: number;
  action: string;
  resource: string;
  targetId?: string;
  detail?: Record<string, any>;
  result?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * 审计服务
 * 负责记录系统中的各种操作日志，用于安全审计和问题追踪
 */
@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext('AuditService');
  }

  /**
   * 记录审计日志
   * @param auditData 审计数据
   * @returns 创建的审计日志
   */
  async audit(auditData: AuditData): Promise<AuditLog> {
    try {
      const auditLog = this.auditLogRepository.create({
        ...auditData,
        result: auditData.result || 'success',
      });

      const savedLog = await this.auditLogRepository.save(auditLog);

      this.logger.log(
        `Audit log created: ${auditData.action} on ${auditData.resource}`,
      );

      return savedLog;
    } catch (error) {
      this.logger.error('Failed to create audit log', error);
      throw error;
    }
  }

  /**
   * 批量记录审计日志
   * @param auditDataList 审计数据列表
   * @returns 创建的审计日志列表
   */
  async auditBatch(auditDataList: AuditData[]): Promise<AuditLog[]> {
    try {
      const auditLogs = auditDataList.map((data) =>
        this.auditLogRepository.create({
          ...data,
          result: data.result || 'success',
        }),
      );

      const savedLogs = await this.auditLogRepository.save(auditLogs);

      this.logger.log(`Batch audit logs created: ${savedLogs.length} logs`);

      return savedLogs;
    } catch (error) {
      this.logger.error('Failed to create batch audit logs', error);
      throw error;
    }
  }

  /**
   * 查询审计日志
   * @param filters 查询条件
   * @param page 页码
   * @param limit 每页数量
   * @returns 审计日志列表和总数
   */
  async findAuditLogs(
    filters: {
      userId?: number;
      tenantId?: number;
      action?: string;
      resource?: string;
      startDate?: Date;
      endDate?: Date;
    },
    page: number = 1,
    limit: number = 20,
  ): Promise<{ logs: AuditLog[]; total: number }> {
    try {
      const queryBuilder = this.auditLogRepository.createQueryBuilder('audit');

      // 添加查询条件
      if (filters.userId) {
        queryBuilder.andWhere('audit.userId = :userId', {
          userId: filters.userId,
        });
      }

      if (filters.tenantId) {
        queryBuilder.andWhere('audit.tenantId = :tenantId', {
          tenantId: filters.tenantId,
        });
      }

      if (filters.action) {
        queryBuilder.andWhere('audit.action = :action', {
          action: filters.action,
        });
      }

      if (filters.resource) {
        queryBuilder.andWhere('audit.resource = :resource', {
          resource: filters.resource,
        });
      }

      if (filters.startDate) {
        queryBuilder.andWhere('audit.createdAt >= :startDate', {
          startDate: filters.startDate,
        });
      }

      if (filters.endDate) {
        queryBuilder.andWhere('audit.createdAt <= :endDate', {
          endDate: filters.endDate,
        });
      }

      // 按创建时间倒序排列
      queryBuilder.orderBy('audit.createdAt', 'DESC');

      // 分页
      const offset = (page - 1) * limit;
      queryBuilder.skip(offset).take(limit);

      const [logs, total] = await queryBuilder.getManyAndCount();

      return { logs, total };
    } catch (error) {
      this.logger.error('Failed to find audit logs', error);
      throw error;
    }
  }

  /**
   * 根据ID查询审计日志
   * @param id 审计日志ID
   * @returns 审计日志
   */
  async findAuditLogById(id: number): Promise<AuditLog | null> {
    try {
      return await this.auditLogRepository.findOne({ where: { id } });
    } catch (error) {
      this.logger.error('Failed to find audit log by ID', error);
      throw error;
    }
  }

  /**
   * 清理过期的审计日志
   * @param days 保留天数
   * @returns 删除的记录数
   */
  async cleanExpiredLogs(days: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const result = await this.auditLogRepository
        .createQueryBuilder()
        .delete()
        .where('createdAt < :cutoffDate', { cutoffDate })
        .execute();

      const deletedCount = result.affected || 0;

      this.logger.log(
        `Cleaned expired audit logs: ${deletedCount} records deleted`,
      );

      return deletedCount;
    } catch (error) {
      this.logger.error('Failed to clean expired audit logs', error);
      throw error;
    }
  }

  /**
   * 获取审计统计信息
   * @param tenantId 租户ID
   * @param days 统计天数
   * @returns 统计信息
   */
  async getAuditStats(
    tenantId?: number,
    days: number = 30,
  ): Promise<{
    totalLogs: number;
    actionStats: Record<string, number>;
    resourceStats: Record<string, number>;
    dailyStats: Array<{ date: string; count: number }>;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const queryBuilder = this.auditLogRepository.createQueryBuilder('audit');
      queryBuilder.where('audit.createdAt >= :startDate', { startDate });

      if (tenantId) {
        queryBuilder.andWhere('audit.tenantId = :tenantId', { tenantId });
      }

      // 总日志数
      const totalLogs = await queryBuilder.getCount();

      // 操作类型统计
      const actionStats = await queryBuilder
        .select('audit.action', 'action')
        .addSelect('COUNT(*)', 'count')
        .groupBy('audit.action')
        .getRawMany();

      // 资源类型统计
      const resourceStats = await queryBuilder
        .select('audit.resource', 'resource')
        .addSelect('COUNT(*)', 'count')
        .groupBy('audit.resource')
        .getRawMany();

      // 每日统计
      const dailyStats = await queryBuilder
        .select('DATE(audit.createdAt)', 'date')
        .addSelect('COUNT(*)', 'count')
        .groupBy('DATE(audit.createdAt)')
        .orderBy('date', 'ASC')
        .getRawMany();

      return {
        totalLogs,
        actionStats: actionStats.reduce(
          (acc, item) => {
            acc[item.action] = parseInt(item.count);
            return acc;
          },
          {} as Record<string, number>,
        ),
        resourceStats: resourceStats.reduce(
          (acc, item) => {
            acc[item.resource] = parseInt(item.count);
            return acc;
          },
          {} as Record<string, number>,
        ),
        dailyStats: dailyStats.map((item) => ({
          date: item.date,
          count: parseInt(item.count),
        })),
      };
    } catch (error) {
      this.logger.error('Failed to get audit stats', error);
      throw error;
    }
  }
}
