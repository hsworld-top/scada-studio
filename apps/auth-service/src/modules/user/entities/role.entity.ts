import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { User } from './user.entity';

/**
 * Role 实体，表示系统中的角色。
 * 包含角色唯一标识、名称及与用户的多对多关系。
 */
@Entity()
export class Role {
  /** 角色主键，自增ID */
  @PrimaryGeneratedColumn()
  id: number;

  /** 角色名称，唯一 */
  @Column({ unique: true })
  name: string;

  /** 拥有该角色的用户列表，多对多关系 */
  @ManyToMany(() => User, (user) => user.roles)
  users: User[];
}
