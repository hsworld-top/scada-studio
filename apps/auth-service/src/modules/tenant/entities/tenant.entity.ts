import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

/**
 * 租户状态枚举
 * - Active: 租户可用
 * - Inactive: 租户已停用，该租户下所有用户无法登录
 * - Suspended: 租户因违规等原因被暂停
 */
export enum TenantStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

/**
 * Tenant 实体，表示一个独立的客户/组织。
 * 这是实现多租户架构的核心。
 */
@Entity()
export class Tenant {
  /**
   * 租户主键，自增ID。
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * 租户名称，必须唯一。
   * @example 'Acme Corporation'
   */
  @Column({ unique: true, length: 100 })
  name: string;

  /**
   * 租户的唯一标识符，可用于子域名或URL路径。
   * @example 'acme'
   */
  @Column({ unique: true, length: 50 })
  slug: string;

  /**
   * 租户状态，用于控制整个租户的可用性。
   */
  @Column({
    type: 'enum',
    enum: TenantStatus,
    default: TenantStatus.ACTIVE,
  })
  status: TenantStatus;

  /**
   * 租户下的所有用户 (反向关系)。
   * @private
   */
  @OneToMany(() => User, (user) => user.tenant)
  users: User[];

  /**
   * 记录创建时间。
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * 记录最后更新时间。
   */
  @UpdateDateColumn()
  updatedAt: Date;
}
