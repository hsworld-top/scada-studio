import {
  IsOptional,
  IsString,
  IsInt,
  IsArray,
  IsNotEmpty,
  IsEmail,
  IsPhoneNumber,
  IsBoolean,
  IsObject,
} from 'class-validator';

/**
 * 创建用户DTO
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