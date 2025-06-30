import {
  IsOptional,
  IsEmail,
  IsPhoneNumber,
  IsObject,
  IsNotEmpty,
  IsInt,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @IsOptional()
  @IsObject()
  preferences?: Record<string, any>;

  @IsInt()
  @IsNotEmpty()
  currentUserId: number;

  @IsInt()
  @IsNotEmpty()
  tenantId: number;

  @IsOptional()
  @IsInt()
  operatorId?: number;
}
