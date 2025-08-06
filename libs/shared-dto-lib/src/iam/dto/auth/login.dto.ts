import { IsInt, IsNotEmpty, IsArray, IsString } from 'class-validator';
import { GatewayLoginDto } from './gateway-login.dto';

/**
 * 登录DTO
 */
export class LoginDto extends GatewayLoginDto {
  /**
   * 租户ID
   */
  @IsInt()
  @IsNotEmpty()
  tenantId: number;

  /**
   * 角色,可以为空数组
   */
  @IsArray()
  @IsNotEmpty({ each: true })
  @IsString({ each: true })
  roles: string[];

  /**
   * 客户端IP地址
   */
  clientIp?: string;
} 