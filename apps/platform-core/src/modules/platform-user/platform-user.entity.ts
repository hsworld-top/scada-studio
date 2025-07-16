import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { UserStatus } from '@app/shared-dto-lib';

/**
 * 平台用户实体
 * 用于存储平台超级管理员账号信息
 */
@Entity('platform_users')
export class PlatformUser {
  /**
   * 用户主键，UUID 格式
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 用户名，唯一
   */
  @Column({ unique: true })
  username: string;

  /**
   * 密码哈希值，使用 bcrypt 加密
   */
  @Column()
  passwordHash: string;

  /**
   * 用户状态（激活/禁用等）
   */
  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  /**
   * 当前会话ID，可为空
   */
  @Column({ nullable: true })
  currentSessionId: string;

  /**
   * 创建时间
   */
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  /**
   * 更新时间
   */
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
