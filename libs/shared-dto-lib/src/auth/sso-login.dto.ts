import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

/**
 * SsoLoginDto 用于单点登录的数据传输对象。
 */
export class SsoLoginDto {
  @IsString()
  @IsNotEmpty()
  ssoToken: string;

  @IsOptional()
  @IsString()
  tenantSlug?: string;
}
