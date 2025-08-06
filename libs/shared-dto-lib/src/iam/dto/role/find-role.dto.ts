import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';

/**
 * 查找单个角色DTO
 */
export class FindOneRoleDto {
  @IsInt()
  @IsNotEmpty()
  id: number;

  @IsInt()
  @IsNotEmpty()
  tenantId: number;
}

/**
 * 查找角色DTO
 */
export class FindRolesDto {
  /**
   * 搜索关键字
   */
  @IsOptional()
  @IsString()
  searchKeyword?: string;

  /**
   * 租户ID
   */
  @IsInt()
  @IsNotEmpty()
  tenantId: number;
} 