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

@Entity('tenant_user')
@Index('idx_user_tenant_username', ['tenantId', 'username'], {
  unique: true,
  where: `"deletedAt" IS NULL`,
})
@Index('idx_user_tenant_email', ['tenantId', 'email'], {
  unique: true,
  where: `"deletedAt" IS NULL AND "email" IS NOT NULL`,
})
@Index('idx_user_tenant_phone', ['tenantId', 'phone'], {
  unique: true,
  where: `"deletedAt" IS NULL AND "phone" IS NOT NULL`,
})
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  username: string;

  @Column()
  password: string;

  @Column({ nullable: true, length: 100 })
  email: string;

  @Column({ nullable: true, length: 20 })
  phone: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({ type: 'jsonb', nullable: true, default: {} })
  preferences: Record<string, any>;

  // 移除 ManyToOne 关联，只保留 tenantId
  @Column()
  tenantId: number;

  @ManyToMany(() => Role, { cascade: true, eager: true })
  @JoinTable({
    name: 'tenant_user_roles_role',
    joinColumn: { name: 'userId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'roleId', referencedColumnName: 'id' },
  })
  roles: Role[];

  @ManyToMany(() => Group, (group) => group.users, { cascade: true })
  @JoinTable({
    name: 'tenant_user_groups_group',
    joinColumn: { name: 'userId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'groupId', referencedColumnName: 'id' },
  })
  groups: Group[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: false })
  allowMultiSession: boolean;

  @BeforeInsert()
  async hashPasswordOnInsert() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  @BeforeUpdate()
  async hashPasswordOnUpdate() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }
}
