import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * 审计日志实体
 * 记录系统中的各种操作日志，用于安全审计和问题追踪
 */
@Entity('tenant_audit_log')
@Index('idx_audit_user_id', ['userId'])
@Index('idx_audit_action', ['action'])
@Index('idx_audit_resource', ['resource'])
@Index('idx_audit_created_at', ['createdAt'])
@Index('idx_audit_tenant_id', ['tenantId'])
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * 操作用户ID
   */
  @Column({ nullable: true })
  userId: number;

  /**
   * 租户ID
   */
  @Column({ nullable: true })
  tenantId: number;

  /**
   * 操作类型（create, read, update, delete, login, logout等）
   */
  @Column({ length: 50 })
  action: string;

  /**
   * 操作资源（user, role, permission等）
   */
  @Column({ length: 50 })
  resource: string;

  /**
   * 目标资源ID
   */
  @Column({ length: 100, nullable: true })
  targetId: string;

  /**
   * 操作详情（JSON格式）
   */
  @Column({ type: 'jsonb', nullable: true })
  detail: Record<string, any>;

  /**
   * 操作结果（success, failed）
   */
  @Column({ length: 20, default: 'success' })
  result: string;

  /**
   * 客户端IP地址
   */
  @Column({ length: 45, nullable: true })
  ipAddress: string;

  /**
   * 用户代理信息
   */
  @Column({ type: 'text', nullable: true })
  userAgent: string;

  /**
   * 创建时间
   */
  @CreateDateColumn()
  createdAt: Date;
}
