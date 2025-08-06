import { IsInt, IsNotEmpty } from 'class-validator';

/**
 * 删除租户DTO
 */
export class DeleteTenantDto {
  @IsInt()
  @IsNotEmpty()
  id: number;
}
