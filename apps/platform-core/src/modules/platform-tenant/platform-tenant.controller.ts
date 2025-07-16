import {
  Controller,
  Post,
  UseGuards,
  Body,
  Delete,
  Get,
  Param,
  Patch,
  Req,
} from '@nestjs/common';
import { CreateTenantDto, UpdateTenantDto } from '@app/shared-dto-lib';
import { I18nService } from 'nestjs-i18n';
import { PlatformSessionGuard } from '../../guards/platform-session.guard';
import { ResponseCode } from '../common/api-response.interface';
import { TenantService } from './platform-tenant.service';
import { AuditTenantLogService } from '../audit/audit-tenant-log.service';

/**
 * 租户管理控制器
 * 提供租户的增删查改接口，并记录操作审计日志
 */
@Controller('tenants')
@UseGuards(PlatformSessionGuard)
export class TenantController {
  /**
   * 构造函数，注入租户服务、i18n、审计服务
   */
  constructor(
    private readonly tenantService: TenantService,
    private readonly i18n: I18nService,
    private readonly auditTenantLogService: AuditTenantLogService,
  ) {}

  /**
   * 创建租户
   * @param req 请求对象，包含当前用户信息
   * @param payload 创建数据
   * @returns 创建结果，含国际化消息
   */
  @Post()
  async create(@Req() req, @Body() payload: CreateTenantDto) {
    const result = await this.tenantService.createTenant(payload);
    await this.auditTenantLogService.audit({
      operation: 'create_tenant',
      superAdminUsername: req.user.username,
      operatorContext: JSON.stringify(payload),
    });
    return {
      code: ResponseCode.SUCCESS,
      msg: this.i18n.t('platform.tenant.create_success'),
      data: result,
    };
  }

  /**
   * 删除租户
   * @param req 请求对象，包含当前用户信息
   * @param id 租户ID
   * @returns 删除结果，含国际化消息
   */
  @Delete(':id')
  async delete(@Req() req, @Param('id') id: number) {
    const result = await this.tenantService.deleteTenant(id);
    await this.auditTenantLogService.audit({
      operation: 'delete_tenant',
      superAdminUsername: req.user.username,
      operatorContext: JSON.stringify(result),
    });
    return {
      code: ResponseCode.SUCCESS,
      msg: this.i18n.t('platform.tenant.delete_success'),
      data: result,
    };
  }

  /**
   * 查询所有租户
   * @param req 请求对象，包含当前用户信息
   * @returns 租户列表，含国际化消息
   */
  @Get()
  async list(@Req() req) {
    const result = await this.tenantService.listTenants();
    await this.auditTenantLogService.audit({
      operation: 'list_tenants',
      superAdminUsername: req.user.username,
    });
    return {
      code: ResponseCode.SUCCESS,
      msg: this.i18n.t('platform.tenant.list_success'),
      data: result,
    };
  }

  /**
   * 更新租户信息
   * @param req 请求对象，包含当前用户信息
   * @param id 租户ID
   * @param payload 更新数据
   * @returns 更新结果，含国际化消息
   */
  @Patch(':id')
  async update(
    @Req() req,
    @Param('id') id: number,
    @Body() payload: UpdateTenantDto,
  ) {
    const result = await this.tenantService.updateTenant(id, payload);
    await this.auditTenantLogService.audit({
      operation: 'update_tenant',
      superAdminUsername: req.user.username,
      operatorContext: JSON.stringify(payload),
    });
    return {
      code: ResponseCode.SUCCESS,
      msg: this.i18n.t('platform.tenant.update_success'),
      data: result,
    };
  }
}
