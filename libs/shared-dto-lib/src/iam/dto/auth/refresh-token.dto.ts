import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * 刷新token DTO
 */
export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;

  @IsOptional()
  @IsString()
  sessionId?: string;
} 