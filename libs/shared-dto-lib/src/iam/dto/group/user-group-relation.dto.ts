import { IsInt, IsNotEmpty, IsArray } from 'class-validator';

/**
 * 向用户组添加用户DTO
 */
export class AddUsersToGroupDto {
  @IsInt()
  @IsNotEmpty()
  tenantId: number;

  @IsInt()
  @IsNotEmpty()
  groupId: number;

  @IsArray()
  @IsInt({ each: true })
  @IsNotEmpty({ each: true })
  userIds: number[];
}

/**
 * 从用户组移除用户DTO
 */
export class RemoveUsersFromGroupDto {
  @IsInt()
  @IsNotEmpty()
  tenantId: number;

  @IsInt()
  @IsNotEmpty()
  groupId: number;

  @IsArray()
  @IsInt({ each: true })
  @IsNotEmpty({ each: true })
  userIds: number[];
}

/**
 * 用户组分配角色DTO
 */
export class AssignRolesToGroupDto {
  @IsInt()
  @IsNotEmpty()
  tenantId: number;

  @IsInt()
  @IsNotEmpty()
  groupId: number;

  @IsArray()
  @IsInt({ each: true })
  @IsNotEmpty({ each: true })
  roleIds: number[];
} 