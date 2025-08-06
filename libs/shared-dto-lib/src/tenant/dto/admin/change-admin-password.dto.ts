import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * 修改平台管理员密码DTO
 */
export class ChangeAdminPasswordDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsOptional()
  user: {
    id: string;
    username: string;
  };
}
