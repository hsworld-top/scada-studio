import { Injectable, UseGuards } from '@nestjs/common';
import { PlatformAuthService } from './platform-auth.service';
import { ResponseCode } from '../common/api-response.interface';
import { AuditTenantLogService } from '../audit/audit-tenant-log.service';
import { PlatformSessionGuard } from '../../guards/platform-session.guard';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';

/**
 * 平台认证控制器
 * 提供平台用户登录、token 刷新等认证相关接口
 */
@Injectable()
export class PlatformAuthController {
  /**
   * 构造函数，注入依赖
   */
  constructor(
    private readonly authService: PlatformAuthService,
    private readonly auditTenantLogService: AuditTenantLogService,
  ) {}

  @MessagePattern('login')
  async login(
    @Payload(new ValidationPipe())
    payload: {
      username: string;
      password: string;
      ip: string;
    },
  ) {
    const result = await this.authService.login(
      payload.username,
      payload.password,
    );
    await this.auditTenantLogService.audit({
      operation: 'login',
      superAdminUsername: payload.username,
      operatorIp: payload.ip,
    });
    return {
      code: ResponseCode.SUCCESS,
      msg: 'login_success',
      data: result,
    };
  }

  @MessagePattern('logout')
  @UseGuards(PlatformSessionGuard)
  async logout(
    @Payload(new ValidationPipe())
    payload: {
      ip: string;
      user: {
        id: number;
        username: string;
      };
    },
  ) {
    await this.authService.logout(payload.user.id.toString());
    await this.auditTenantLogService.audit({
      operation: 'logout',
      superAdminUsername: payload.user.username,
      operatorIp: payload.ip,
    });
    return {
      code: ResponseCode.SUCCESS,
      msg: 'logout_success',
      data: null,
    };
  }
}
