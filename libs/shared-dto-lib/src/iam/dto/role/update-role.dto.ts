import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';

/**
 * 更新角色DTO
 */
export class UpdateRoleDto {
  /**
   * 角色ID
   */
  @IsInt()
  @IsNotEmpty()
  id: number;

  /**
   * 角色名
   */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

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