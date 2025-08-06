import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';

/**
 * 查找用户组DTO
 */
export class FindGroupsDto {
  @IsOptional()
  @IsString()
  searchKeyword?: string;

  @IsInt()
  @IsNotEmpty()
  tenantId: number;
}

/**
 * 查找单个用户组DTO
 */
export class FindOneGroupDto {
  @IsInt()
  @IsNotEmpty()
  id: number;
} 