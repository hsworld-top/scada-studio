/**
 * CreateUserDto 用于创建用户时的数据传输对象。
 * 包含用户名、密码和角色名称列表。
 */
export class CreateUserDto {
  /** 用户名 */
  username: string;
  /** 密码（可选） */
  password?: string;
  /** 角色名称数组 */
  roleNames: string[];
}
