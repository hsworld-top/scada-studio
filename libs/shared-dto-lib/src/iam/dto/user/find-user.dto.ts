import { IsInt, IsNotEmpty } from 'class-validator';

/**
 * 查找所有用户DTO
 */
export class FindAllUserDto {
  @IsInt()
  @IsNotEmpty()
  tenantId: number;
}

/**
 * 查找单个用户DTO
 */
export class FindOneUserDto {
  @IsInt()
  @IsNotEmpty()
  id: number;

  @IsInt()
  @IsNotEmpty()
  tenantId: number;
} 