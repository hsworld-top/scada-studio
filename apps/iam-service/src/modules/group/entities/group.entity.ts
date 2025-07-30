import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  JoinTable,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Role } from '../../role/entities/role.entity';
/**
 * 用户组实体
 * @description 用户组实体是用户组管理的核心实体，用于存储用户组的基本信息和关联关系。
 * 用户组实体与用户、角色、租户等实体之间存在多对多关联关系。
 * 用户组实体与用户、角色、租户等实体之间存在多对多关联关系。
 */
@Entity('tenant_group')
/**
 * 用户组名唯一索引
 */
@Index('idx_group_tenant_name', ['tenantId', 'name'], {
  unique: true,
  where: `"deletedAt" IS NULL`,
})
export class Group {
  /**
   * 用户组ID
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * 用户组名
   */
  @Column({ length: 100 })
  name: string;

  /**
   * 用户组描述
   */
  @Column({ type: 'text', nullable: true })
  description: string;

  /**
   * 租户ID
   */
  @Column()
  tenantId: number;

  /**
   * 用户组关联用户
   */
  @ManyToMany(() => User, (user) => user.groups)
  users: User[];

  /**
   * 用户组关联角色
   */
  @ManyToMany(() => Role, { cascade: true })
  @JoinTable({
    name: 'tenant_group_roles_role',
    joinColumn: { name: 'groupId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'roleId', referencedColumnName: 'id' },
  })
  roles: Role[];

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
}
