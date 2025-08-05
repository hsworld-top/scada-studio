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
  CAPTCHA_CACHE: 'captcha_cache', // 验证码
  LOGIN_ATTEMPTS_CACHE: 'login_attempts_cache', // 登录尝试次数
  REFRESH_TOKEN_CACHE: 'refresh_token_cache', // 刷新 token
  BLACKLIST_CACHE: 'blacklist_cache', // 黑名单
};
/**管理员角色名 */
export const ADMIN_ROLE_NAME = 'admin';

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
/**
 * 登录
 */
export class GatewayLoginDto {
  /**
   * 用户名
   */
  @IsString()
  @IsNotEmpty()
  username: string;

  /**
   * 密码
   */
  @IsString()
  @IsNotEmpty()
  password: string;

  /**
   * 验证码的唯一ID (如果开启了验证码功能)
   */
  @IsOptional()
  @IsString()
  captchaId?: string;

  /**
   * 用户输入的验证码文本 (如果开启了验证码功能)
   */
  @IsOptional()
  @IsString()
  captchaText?: string;

  /**
   * 密钥标识 (新的密码加密方式)
   */
  @IsOptional()
  @IsString()
  keyId?: string;
}

/**
 * 网关登录 透传参数
 */
export class LoginDto extends GatewayLoginDto {
  /**
   * 租户ID
   */
  @IsInt()
  @IsNotEmpty()
  tenantId: number;

  /**
   * 角色,可以为空数组
   */
  @IsArray()
  @IsNotEmpty({ each: true })
  @IsString({ each: true })
  roles: string[];

  /**
   * 客户端IP地址
   */
  clientIp?: string;
}
/**
 * 登出
 */
export class LogoutDto {
  @IsString()
  @IsNotEmpty()
  accessToken: string;
}
/**
 * 刷新token
 */
export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;

  @IsOptional()
  @IsString()
  sessionId?: string;
}
/**
 * 权限装饰器
 */
export const PERMISSIONS_KEY = 'permissions';
/**
 * 添加权限策略
 */
export class AddPolicyDto {
  @IsString()
  @IsNotEmpty()
  role: string;

  @IsString()
  @IsNotEmpty()
  resource: string;

  @IsString()
  @IsNotEmpty()
  action: string;

  @IsInt()
  @IsNotEmpty()
  tenantId: number;
}
/**
 * 删除权限策略
 */
export class RemovePolicyDto {
  @IsString()
  @IsNotEmpty()
  role: string;

  @IsString()
  @IsNotEmpty()
  resource: string;

  @IsString()
  @IsNotEmpty()
  action: string;

  @IsInt()
  @IsNotEmpty()
  tenantId: number;
}
/**
 * 获取角色权限
 */
export class GetPermissionsForRoleDto {
  @IsString()
  @IsNotEmpty()
  role: string;

  @IsInt()
  @IsNotEmpty()
  tenantId: number;
}

/**
 * 用户组分配角色
 */
export class AssignRolesToGroupDto {
  @IsInt()
  @IsNotEmpty()
  tenantId: number;

  @IsInt()
  @IsNotEmpty()
  groupId: number;

  @IsArray()
  @IsInt({ each: true })
  @IsNotEmpty({ each: true })
  roleIds: number[];
}
/**
 * 初始化租户
 */
export class InitTenantDto {
  @IsInt()
  @IsNotEmpty()
  tenantId: number;
}
