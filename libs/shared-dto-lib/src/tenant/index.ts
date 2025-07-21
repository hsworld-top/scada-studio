// 租户相关的DTO类和枚举类型定义
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
} from 'class-validator';
// 租户状态枚举类型
export enum TenantStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}
// 创建租户的DTO类
export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;
}
// 删除租户的DTO类
export class DeleteTenantDto {
  @IsInt()
  @IsNotEmpty()
  id: number;
}
// 更新租户的DTO类
export class UpdateTenantDto {
  @IsString()
  @IsOptional()
  name: string;

  @IsString()
  @IsOptional()
  slug: string;

  @IsEnum(TenantStatus)
  @IsOptional()
  status: TenantStatus;
}
// 创建平台管理员的DTO类
export class CreateAdminDto {
  @IsNotEmpty()
  @IsString()
  username: string;
  @IsNotEmpty()
  @IsString()
  password: string;
}
// 删除平台管理员的DTO类
export class DeleteAdminDto {
  @IsNotEmpty()
  @IsString()
  id: string;
}
// 修改平台管理员密码的DTO类
export class ChangeAdminPasswordDto {
  @IsNotEmpty()
  @IsString()
  id: string;
  @IsNotEmpty()
  @IsString()
  password: string;
}
// 平台管理员登录的DTO类
export class adminLoginDto {
  @IsNotEmpty()
  @IsString()
  username: string;
  @IsNotEmpty()
  @IsString()
  password: string;
}
