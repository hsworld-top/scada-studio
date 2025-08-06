import { IsInt, IsNotEmpty } from 'class-validator';

/**
 * 删除角色DTO
 */
export class RemoveRoleDto {
  @IsInt()
  @IsNotEmpty()
  id: number;

  @IsInt()
  @IsNotEmpty()
  tenantId: number;
} 