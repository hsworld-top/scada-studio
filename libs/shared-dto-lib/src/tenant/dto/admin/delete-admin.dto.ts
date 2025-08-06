import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * 删除平台管理员DTO
 */
export class DeleteAdminDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsOptional()
  user: {
    id: string;
    username: string;
  };
}
