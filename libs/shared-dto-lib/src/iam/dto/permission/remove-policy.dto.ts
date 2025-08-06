import { IsString, IsNotEmpty, IsInt } from 'class-validator';

/**
 * 删除权限策略DTO
 */
export class RemovePolicyDto {
  @IsString()
  @IsNotEmpty()
  role: string;

  @IsString()
  @IsNotEmpty()
  resource: string;

  @IsString()
  @IsNotEmpty()
  action: string;

  @IsInt()
  @IsNotEmpty()
  tenantId: number;
} 