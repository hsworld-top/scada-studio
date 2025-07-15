import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

/**
 * LoginDto 用于用户登录的数据传输对象（多租户版，带验证码）。
 */
export class LoginDto {
  /**
   * 租户的唯一标识符（slug）。
   * @example 'default'
   */
  @IsString()
  @IsNotEmpty()
  tenantSlug: string;

  /**
   * 用户名
   */
  @IsString()
  @IsNotEmpty()
  username: string;

  /**
   * 密码
   */
  @IsString()
  @IsNotEmpty()
  password: string;

  /**
   * 验证码的唯一ID (如果开启了验证码功能)
   */
  @IsOptional()
  @IsString()
  captchaId?: string;

  /**
   * 用户输入的验证码文本 (如果开启了验证码功能)
   */
  @IsOptional()
  @IsString()
  captchaText?: string;

  /**
   * 密钥标识 (新的密码加密方式)
   */
  @IsOptional()
  @IsString()
  keyId?: string;

  /**
   * (内部使用) 客户端IP地址，由API网关透传
   */
  ip?: string;
}
