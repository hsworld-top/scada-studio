import { IsInt, IsNotEmpty } from 'class-validator';

/**
 * 初始化租户DTO
 */
export class InitTenantDto {
  @IsInt()
  @IsNotEmpty()
  tenantId: number;
} 