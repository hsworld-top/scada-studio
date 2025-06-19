// src/modules/auth/dto/login.dto.ts

import { IsNotEmpty, IsString } from 'class-validator';

/**
 * LoginDto 用于用户登录的数据传输对象（多租户版）。
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
}
