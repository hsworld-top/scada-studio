import {
  IsString,
  IsOptional,
  IsEmail,
  IsArray,
  IsInt,
  IsPhoneNumber,
  IsEnum,
  IsNotEmpty, // 导入 IsNotEmpty 装饰器
  MinLength,
} from 'class-validator'; // 导入验证器装饰器
import { UserStatus } from './user-status.enum'; // 导入 UserStatus 枚举类型

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
  allowMultiSession?: boolean;
}
