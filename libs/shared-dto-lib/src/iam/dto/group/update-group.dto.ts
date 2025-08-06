import { IsString, IsNotEmpty, IsOptional, IsInt, IsArray } from 'class-validator';

/**
 * 更新用户组DTO
 */
export class UpdateGroupDto {
  @IsInt()
  @IsNotEmpty()
  id: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  parentId?: number | null;

  @IsInt()
  @IsNotEmpty()
  tenantId: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @IsNotEmpty({ each: true })
  roleIds?: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @IsNotEmpty({ each: true })
  userIds?: number[];
} 