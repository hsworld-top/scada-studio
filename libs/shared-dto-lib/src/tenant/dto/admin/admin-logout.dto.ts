import { IsOptional } from 'class-validator';

/**
 * 平台管理员登出DTO
 */
export class AdminLogoutDto {
  @IsOptional()
  ip: string;

  @IsOptional()
  user: {
    id: string;
    username: string;
  };
}
