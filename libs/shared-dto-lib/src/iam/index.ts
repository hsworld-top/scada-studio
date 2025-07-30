import {
  IsOptional,
  IsString,
  IsInt,
  IsArray,
  IsNotEmpty,
  MinLength,
  IsEmail,
  IsPhoneNumber,
  IsEnum,
  IsBoolean,
  IsObject,
} from 'class-validator';

/**
 * 缓存键
 */
export const IAM_CACHE_KEYS = {
  PERMISSION_CACHE: 'permission_cache',
  ROLE_CACHE: 'role_cache',
  USER_CACHE: 'user_cache',
  GROUP_CACHE: 'group_cache',
  TENANT_CACHE: 'tenant_cache',
};
/**
 * 用户状态
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  LOCKED = 'locked',
  DELETED = 'deleted',
}
/**
 * 查找所有用户
 */
export class FindAllUserDto {
  @IsInt()
  @IsNotEmpty()
  tenantId: number;
}
/**
 * 查找单个用户
 */
export class FindOneUserDto {
  @IsInt()
  @IsNotEmpty()
  id: number;

  @IsInt()
  @IsNotEmpty()
  tenantId: number;
}
/**
 * 创建用户
 */
export class CreateUserDto {
  @IsInt()
  @IsNotEmpty()
  tenantId: number;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @IsArray()
  @IsInt({ each: true })
  @IsNotEmpty({ each: true })
  roleIds: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  groupIds?: number[];

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  operatorId?: number;

  @IsOptional()
  @IsBoolean()
  allowMultiSession?: boolean;
  /**
   * 偏好设置
   */
  @IsOptional()
  @IsObject()
  preferences?: Record<string, any>;
}
/**
 * 批量删除用户
 */
export class RemoveUsersDto {
  @IsArray()
  @IsInt({ each: true })
  @IsNotEmpty({ each: true })
  ids: number[];

  @IsInt()
  @IsNotEmpty()
  tenantId: number;
}
/**
 * 更新用户
 */
export class UpdateUserDto {
  @IsInt()
  @IsNotEmpty()
  id: number;

  @IsOptional()
  @IsString()
  username?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  roleIds?: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  groupIds?: number[];

  @IsInt()
  @IsNotEmpty()
  tenantId: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  operatorId?: number;

  @IsOptional()
  @IsBoolean()
  allowMultiSession?: boolean;

  @IsOptional()
  @IsObject()
  preferences?: Record<string, any>;
}
/**
 * 创建角色
 */
export class CreateRoleDto {
  /**
   * 角色名
   */
  @IsString()
  @IsNotEmpty()
  name: string;

  /**
   * 角色描述
   */
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * 租户ID
   */
  @IsInt()
  @IsNotEmpty()
  tenantId: number;
}
/**
 * 查找单个角色
 */
export class FindOneRoleDto {
  @IsInt()
  @IsNotEmpty()
  id: number;

  @IsInt()
  @IsNotEmpty()
  tenantId: number;
}
/**
 * 查找角色
 */
export class FindRolesDto {
  /**
   * 搜索关键字
   */
  @IsOptional()
  @IsString()
  searchKeyword?: string;

  /**
   * 租户ID
   */
  @IsInt()
  @IsNotEmpty()
  tenantId: number;
}
/**
 * 更新角色
 */
export class UpdateRoleDto {
  /**
   * 角色ID
   */
  @IsInt()
  @IsNotEmpty()
  id: number;

  /**
   * 角色名
   */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  /**
   * 角色描述
   */
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * 租户ID
   */
  @IsInt()
  @IsNotEmpty()
  tenantId: number;
}
/**
 * 删除角色
 */
export class RemoveRoleDto {
  @IsInt()
  @IsNotEmpty()
  id: number;

  @IsInt()
  @IsNotEmpty()
  tenantId: number;
}

/**
 * 创建用户组
 */
export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  parentId?: number | null;

  @IsInt()
  @IsNotEmpty()
  tenantId: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @IsNotEmpty({ each: true })
  roleIds?: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @IsNotEmpty({ each: true })
  userIds?: number[];
}
/**
 * 查找用户组
 */
export class FindGroupsDto {
  @IsOptional()
  @IsString()
  searchKeyword?: string;

  @IsInt()
  @IsNotEmpty()
  tenantId: number;
}
/**
 * 查找单个用户组
 */
export class FindOneGroupDto {
  @IsInt()
  @IsNotEmpty()
  id: number;
}
/**
 * 更新用户组
 */
export class UpdateGroupDto {
  @IsInt()
  @IsNotEmpty()
  id: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  parentId?: number | null;

  @IsInt()
  @IsNotEmpty()
  tenantId: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @IsNotEmpty({ each: true })
  roleIds?: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @IsNotEmpty({ each: true })
  userIds?: number[];
}
/**
 * 删除用户组
 */
export class RemoveGroupDto {
  @IsInt()
  @IsNotEmpty()
  id: number;
}

/**
 * 向用户组添加用户
 */
export class AddUsersToGroupDto {
  @IsInt()
  @IsNotEmpty()
  tenantId: number;

  @IsInt()
  @IsNotEmpty()
  groupId: number;

  @IsArray()
  @IsInt({ each: true })
  @IsNotEmpty({ each: true })
  userIds: number[];
}

/**
 * 从用户组移除用户
 */
export class RemoveUsersFromGroupDto {
  @IsInt()
  @IsNotEmpty()
  tenantId: number;

  @IsInt()
  @IsNotEmpty()
  groupId: number;

  @IsArray()
  @IsInt({ each: true })
  @IsNotEmpty({ each: true })
  userIds: number[];
}
