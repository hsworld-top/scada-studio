import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BeforeInsert,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  BeforeUpdate,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from '../../role/entities/role.entity';
import { Group } from '../../group/entities/group.entity';
import { UserStatus } from '@app/shared-dto-lib';
/**
 * 用户实体
 * @description
 * 用户实体是用户管理的核心实体，用于存储用户的基本信息和关联关系。
 * 用户实体与角色、组、租户等实体之间存在多对多关联关系。
 * 用户实体与角色、组、租户等实体之间存在多对多关联关系。
 */
@Entity('tenant_user')
/**
 * 用户名唯一索引
 */
@Index('idx_user_tenant_username', ['tenantId', 'username'], {
  unique: true,
  where: `"deletedAt" IS NULL`,
})
/**
 * 邮箱唯一索引
 */
@Index('idx_user_tenant_email', ['tenantId', 'email'], {
  unique: true,
  where: `"deletedAt" IS NULL AND "email" IS NOT NULL`,
})
/**
 * 手机号唯一索引
 */
@Index('idx_user_tenant_phone', ['tenantId', 'phone'], {
  unique: true,
  where: `"deletedAt" IS NULL AND "phone" IS NOT NULL`,
})
export class User {
  /**
   * 用户ID
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * 用户名
   */
  @Column({ length: 100 })
  username: string;

  /**
   * 密码
   */
  @Column()
  password: string;

  /**
   * 邮箱
   */
  @Column({ nullable: true, length: 100 })
  email: string;

  /**
   * 手机号
   */
  @Column({ nullable: true, length: 20 })
  phone: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  /**
   * 偏好设置
   */
  @Column({ type: 'jsonb', nullable: true, default: {} })
  preferences: Record<string, any>;

  /**
   * 租户ID
   */
  @Column()
  tenantId: number;

  /**
   * 角色
   */
  @ManyToMany(() => Role, { cascade: true, eager: true })
  @JoinTable({
    name: 'tenant_user_roles_role',
    joinColumn: { name: 'userId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'roleId', referencedColumnName: 'id' },
  })
  roles: Role[];

  /**
   * 组
   */
  @ManyToMany(() => Group, (group) => group.users, { cascade: true })
  @JoinTable({
    name: 'tenant_user_groups_group',
    joinColumn: { name: 'userId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'groupId', referencedColumnName: 'id' },
  })
  groups: Group[];

  /**
   * 创建时间
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * 更新时间
   */
  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * 删除时间
   */
  @DeleteDateColumn()
  deletedAt: Date;

  /**
   * 描述
   */
  @Column({ type: 'text', nullable: true })
  description: string;

  /**
   * 是否允许多会话
   */
  @Column({ type: 'boolean', default: false })
  allowMultiSession: boolean;

  /**
   * 插入前加密密码
   */
  @BeforeInsert()
  async hashPasswordOnInsert() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  /**
   * 更新前加密密码
   */
  @BeforeUpdate()
  async hashPasswordOnUpdate() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }
}
