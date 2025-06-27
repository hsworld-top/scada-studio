import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('audit_log')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  userId: number;

  @Column({ nullable: true })
  tenantId: number;

  @Column()
  action: string;

  @Column()
  resource: string;

  @Column({ nullable: true })
  targetId: string;

  @Column({ type: 'jsonb', nullable: true })
  detail: any;

  @Column({ default: 'success' })
  result: string;

  @Column({ nullable: true })
  ip: string;

  @CreateDateColumn()
  createdAt: Date;
} 