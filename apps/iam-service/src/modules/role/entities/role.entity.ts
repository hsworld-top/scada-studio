import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  Index,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity()
@Index('idx_role_tenant_name', ['tenantId', 'name'], { unique: true })
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  // 移除 ManyToOne 关联，只保留 tenantId
  @Column()
  tenantId: number;

  @ManyToMany(() => User, (user) => user.roles)
  users: User[];
}