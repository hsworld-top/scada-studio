import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TenantQuota, TenantStatus } from '@app/shared-dto-lib';

/**
 * 租户实体
 * 表示一个独立的客户/组织，是多租户架构的核心
 */
@Entity('platform_tenants')
export class Tenant {
  /**
   * 租户主键，自增ID
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * 租户名称，唯一
   */
  @Column({ unique: true, length: 100 })
  name: string;

  /**
   * 租户唯一标识符（如子域名、URL路径），唯一
   */
  @Column({ unique: true, length: 50 })
  slug: string;

  /**
   * 租户状态（激活/禁用等）
   */
  @Column({
    type: 'enum',
    enum: TenantStatus,
    default: TenantStatus.ACTIVE,
  })
  status: TenantStatus;

  /**
   * 创建时间
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * 最后更新时间
   */
  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * 租户配额
   */
  @Column({ type: 'jsonb', nullable: true })
  quota: TenantQuota;
}
