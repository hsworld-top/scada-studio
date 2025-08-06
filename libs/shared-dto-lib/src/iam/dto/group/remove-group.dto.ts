import { IsInt, IsNotEmpty } from 'class-validator';

/**
 * 删除用户组DTO
 */
export class RemoveGroupDto {
  @IsInt()
  @IsNotEmpty()
  id: number;
} 