import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Tenant } from '../../tenant/entities/tenant.entity';

@Entity()
@Index(['tenantId'], { unique: true })
export class SecuritySettings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenantId: number;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ type: 'int', default: 5 })
  maxLoginAttempts: number;

  @Column({ type: 'int', default: 900 }) // 15分钟
  lockDurationSeconds: number;

  @Column({ type: 'simple-json', default: '[]' })
  usernameBlacklist: string[];
}
