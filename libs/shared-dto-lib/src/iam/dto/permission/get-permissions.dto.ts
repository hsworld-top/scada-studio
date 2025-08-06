import { IsString, IsNotEmpty, IsInt } from 'class-validator';

/**
 * 获取角色权限DTO
 */
export class GetPermissionsForRoleDto {
  @IsString()
  @IsNotEmpty()
  role: string;

  @IsInt()
  @IsNotEmpty()
  tenantId: number;
} 