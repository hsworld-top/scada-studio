import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity()
@Index('idx_security_tenant', ['tenantId'], { unique: true })
export class SecuritySettings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenantId: number;

  @Column({ type: 'int', default: 5 })
  maxLoginAttempts: number;

  @Column({ type: 'int', default: 15 })
  lockoutDurationMinutes: number;

  @Column({ type: 'int', default: 8 })
  minPasswordLength: number;

  @Column({ type: 'boolean', default: true })
  requireUppercase: boolean;

  @Column({ type: 'boolean', default: true })
  requireLowercase: boolean;

  @Column({ type: 'boolean', default: true })
  requireNumbers: boolean;

  @Column({ type: 'boolean', default: true })
  requireSpecialChars: boolean;

  @Column({ type: 'int', default: 90 })
  passwordExpiryDays: number;

  @Column({ type: 'int', default: 5 })
  passwordHistoryCount: number;

  @Column({ type: 'int', default: 30 })
  sessionTimeoutMinutes: number;

  @Column({ type: 'boolean', default: false })
  enableTwoFactor: boolean;

  @Column({ type: 'boolean', default: true })
  enableCaptcha: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}