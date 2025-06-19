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
  ManyToOne,
  JoinColumn,
  Index,
  BeforeUpdate,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from './role.entity';
import { Group } from './group.entity';
import { Tenant } from '../../tenant/entities/tenant.entity';

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity()
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

  @Column()
  tenantId: number;

  @ManyToOne(() => Tenant, (tenant) => tenant.users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @ManyToMany(() => Role, { cascade: true, eager: true })
  @JoinTable({
    name: 'user_roles_role',
    joinColumn: { name: 'userId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'roleId', referencedColumnName: 'id' },
  })
  roles: Role[];

  @ManyToMany(() => Group, (group) => group.users, { cascade: true })
  @JoinTable({
    name: 'user_groups_group',
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

  @BeforeInsert()
  async hashPasswordOnInsert() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  @BeforeUpdate()
  async hashPasswordOnUpdate() {
    // This hook is called when `userRepository.save(user)` is used on an existing entity.
    // We need to check if the password has changed. A common way is to check its length
    // or if it looks like a hash. A plain password will likely not be 60 characters.
    if (this.password && this.password.length < 60) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }
}
