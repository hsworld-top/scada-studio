import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  Index,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
/**
 * 角色实体
 * @description
 * 角色实体是角色管理的核心实体，用于存储角色的基本信息和关联关系。
 * 角色实体与用户、组、租户等实体之间存在多对多关联关系。
 * 角色实体与用户、组、租户等实体之间存在多对多关联关系。
 */
@Entity('tenant_role')
/**
 * 角色名唯一索引
 */
@Index('idx_role_tenant_name', ['tenantId', 'name'], { unique: true })
export class Role {
  /**
   * 角色ID
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * 角色名
   */
  @Column({ length: 100 })
  name: string;

  /**
   * 角色描述
   */
  @Column({ type: 'text', nullable: true })
  description: string;

  /**
   * 租户ID
   */
  @Column()
  tenantId: number;

  /**
   * 用户
   */
  @ManyToMany(() => User, (user) => user.roles)
  users: User[];
}
