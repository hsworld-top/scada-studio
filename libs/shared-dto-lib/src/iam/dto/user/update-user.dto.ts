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
import { UserStatus } from '../../enums/user-status';

/**
 * 更新用户DTO
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