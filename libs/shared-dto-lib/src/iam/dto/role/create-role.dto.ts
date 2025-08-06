import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';

/**
 * 创建角色DTO
 */
export class CreateRoleDto {
  /**
   * 角色名
   */
  @IsString()
  @IsNotEmpty()
  name: string;

  /**
   * 角色描述
   */
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * 租户ID
   */
  @IsInt()
  @IsNotEmpty()
  tenantId: number;
} 