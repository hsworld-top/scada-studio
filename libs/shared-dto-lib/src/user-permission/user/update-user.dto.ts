import {
  IsString,
  IsOptional,
  IsEmail,
  IsArray,
  IsInt,
  IsPhoneNumber,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';
import { UserStatus } from './user-status.enum';

export class UpdateUserDto {
  @IsInt()
  @IsNotEmpty()
  userId: number;

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
  @IsString({ each: true })
  roleNames?: string[];

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
