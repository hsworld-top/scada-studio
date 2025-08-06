import { IsString, IsNotEmpty } from 'class-validator';

/**
 * 创建平台管理员DTO
 */
export class CreateAdminDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
