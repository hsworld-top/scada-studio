import { Controller, Post, Body, Ip, UseGuards } from '@nestjs/common';
import { Req } from '@nestjs/common';
import { PlatformAuthService } from './platform-auth.service';
import { ResponseCode } from '../common/api-response.interface';
import { I18nService } from 'nestjs-i18n';
import { AuditTenantLogService } from '../audit/audit-tenant-log.service';
import { PlatformSessionGuard } from '../../guards/platform-session.guard';

/**
 * 平台认证控制器
 * 提供平台用户登录、token 刷新等认证相关接口
 */
@Controller('platform/auth')
export class PlatformAuthController {
  /**
   * 构造函数，注入依赖
   */
  constructor(
    private readonly authService: PlatformAuthService,
    private readonly i18n: I18nService,
    private readonly auditTenantLogService: AuditTenantLogService,
  ) {}

  @Post('login')
  async login(
    @Body() body: { username: string; password: string },
    @Ip() ip: string,
  ) {
    const result = await this.authService.login(body.username, body.password);
    await this.auditTenantLogService.audit({
      operation: 'login',
      superAdminUsername: body.username,
      operatorIp: ip,
    });
    return {
      code: ResponseCode.SUCCESS,
      msg: this.i18n.t('platform.auth.login_success'),
      data: result,
    };
  }

  @Post('logout')
  @UseGuards(PlatformSessionGuard)
  async logout(@Req() req, @Ip() ip: string) {
    await this.authService.logout(req.user.id);
    await this.auditTenantLogService.audit({
      operation: 'logout',
      superAdminUsername: req.user.username,
      operatorIp: ip,
    });
    return {
      code: ResponseCode.SUCCESS,
      msg: this.i18n.t('platform.auth.logout_success'),
    };
  }
}
