import { IsJWT, IsNotEmpty } from 'class-validator';

/**
 * RefreshTokenDto 用于刷新 access_token。
 */
export class RefreshTokenDto {
  @IsJWT()
  @IsNotEmpty()
  refreshToken: string;
}
