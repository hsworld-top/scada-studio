import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
} from 'class-validator';
export enum TenantStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}
export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;
}
export class DeleteTenantDto {
  @IsInt()
  @IsNotEmpty()
  id: number;
}
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

export class CreateAdminDto {
  @IsNotEmpty()
  @IsString()
  username: string;
  @IsNotEmpty()
  @IsString()
  password: string;
}
export class DeleteAdminDto {
  @IsNotEmpty()
  @IsString()
  id: string;
}
export class GetAdminDto {
  @IsNotEmpty()
  @IsString()
  id: string;
}
export class ChangeAdminPasswordDto {
  @IsNotEmpty()
  @IsString()
  id: string;
  @IsNotEmpty()
  @IsString()
  password: string;
}
export class adminLoginDto {
  @IsNotEmpty()
  @IsString()
  username: string;
  @IsNotEmpty()
  @IsString()
  password: string;
}
