import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BeforeInsert,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from './role.entity';

/**
 * User 实体，表示系统中的用户。
 * 包含用户唯一标识、用户名、密码、角色等信息。
 */
@Entity()
export class User {
  /** 用户主键，自增ID */
  @PrimaryGeneratedColumn()
  id: number;

  /** 用户名，唯一 */
  @Column({ unique: true })
  username: string;

  /** 用户密码，存储加密后的密文 */
  @Column()
  password: string;

  /** 用户拥有的角色，多对多关系，级联保存并自动加载 */
  @ManyToMany(() => Role, { cascade: true, eager: true })
  @JoinTable()
  roles: Role[];

  /**
   * 在插入数据库前自动对密码进行加密。
   */
  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 10);
  }
}
