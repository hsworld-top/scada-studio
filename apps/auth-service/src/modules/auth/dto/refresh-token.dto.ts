import { IsJWT, IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * RefreshTokenDto 用于刷新 access_token。
 */
export class RefreshTokenDto {
  @IsJWT()
  @IsNotEmpty()
  refreshToken: string;

  /**
   * 普通用户多端登录时需带的 sessionId
   */
  @IsOptional()
  @IsString()
  sessionId?: string;
}
