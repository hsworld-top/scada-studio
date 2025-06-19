import { IsJWT, IsNotEmpty } from 'class-validator';

/**
 * SsoLoginDto 用于处理单点登录请求。
 */
export class SsoLoginDto {
  /**
   * 由第三方身份提供方 (IdP) 签发的 JWT (SSO Token)。
   */
  @IsJWT()
  @IsNotEmpty()
  token: string;
}
