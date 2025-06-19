import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  Tree,
  TreeChildren,
  TreeParent,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Tenant } from '../../tenant/entities/tenant.entity';

@Entity()
@Tree('materialized-path')
export class Group {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  tenantId: number;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @ManyToMany(() => User, (user) => user.groups)
  users: User[];

  @TreeChildren()
  children: Group[];

  @TreeParent({ onDelete: 'CASCADE' })
  parent: Group | null;
}
