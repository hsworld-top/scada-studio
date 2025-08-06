import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import { TenantQuota } from '../../types/tenant-quota';

/**
 * 创建租户DTO
 */
export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsObject()
  @IsOptional()
  quota: TenantQuota;

  @IsOptional()
  user: {
    id: string;
    username: string;
  };
}
