import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

/**
 * 租户操作审计日志实体
 * 用于记录平台超级管理员对租户相关的操作行为
 */
@Entity('platform_audit_tenant_log')
export class AuditTenantLog {
  /**
   * 日志主键，自增ID
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * 操作超级管理员用户名
   */
  @Column({ nullable: true })
  superAdminUsername: string;

  /**
   * 操作类型（如 create_tenant、delete_tenant 等）
   */
  @Column({ nullable: true })
  operation: string;

  /**
   * 操作人IP地址
   */
  @Column({ nullable: true })
  operatorIp: string;

  /**
   * 操作上下文（如操作参数、详情等，JSON 字符串）
   */
  @Column({ type: 'text', nullable: true })
  operatorContext: string;

  /**
   * 日志创建时间
   */
  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}
