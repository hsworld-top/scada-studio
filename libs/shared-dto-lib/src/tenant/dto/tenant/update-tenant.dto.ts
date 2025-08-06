import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsInt,
  IsEnum,
} from 'class-validator';
import { TenantQuota } from '../../types/tenant-quota';
import { TenantStatus } from '../../enums/tenant-status';

/**
 * 更新租户基础DTO
 */
export class UpdateTenantBaseDto {
  @IsString()
  @IsOptional()
  name: string;

  @IsString()
  @IsOptional()
  slug: string;

  @IsObject()
  @IsOptional()
  quota: TenantQuota;

  @IsEnum(TenantStatus)
  @IsOptional()
  status: TenantStatus;

  @IsOptional()
  user: {
    id: string;
    username: string;
  };
}

/**
 * 更新租户DTO（包含 id）
 */
export class UpdateTenantDto extends UpdateTenantBaseDto {
  @IsInt()
  @IsNotEmpty()
  id: number;
}
