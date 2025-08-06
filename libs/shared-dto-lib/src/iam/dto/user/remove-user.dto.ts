import { IsArray, IsInt, IsNotEmpty } from 'class-validator';

/**
 * 批量删除用户DTO
 */
export class RemoveUsersDto {
  @IsArray()
  @IsInt({ each: true })
  @IsNotEmpty({ each: true })
  ids: number[];

  @IsInt()
  @IsNotEmpty()
  tenantId: number;
} 