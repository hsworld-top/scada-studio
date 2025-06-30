import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsOptional,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

class PermissionDto {
  @IsString()
  @IsNotEmpty()
  resource: string;

  @IsString()
  @IsNotEmpty()
  action: string;
}

export class UpdatePermissionsDto {
  @IsString()
  @IsNotEmpty()
  roleName: string;

  @IsString()
  @IsNotEmpty()
  tenantId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionDto)
  permissions: PermissionDto[];

  @IsOptional()
  @IsInt()
  operatorId?: number;
}
