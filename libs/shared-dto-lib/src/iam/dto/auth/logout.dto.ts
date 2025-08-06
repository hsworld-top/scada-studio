import { IsString, IsNotEmpty } from 'class-validator';

/**
 * 登出DTO
 */
export class LogoutDto {
  @IsString()
  @IsNotEmpty()
  accessToken: string;
} 