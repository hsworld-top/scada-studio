import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * 网关登录DTO
 */
export class GatewayLoginDto {
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
} 