import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * 平台管理员登录DTO
 */
export class AdminLoginDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsOptional()
  ip: string;
}
