import {
  Controller,
  Post,
  Body,
  Delete,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PlatformUserService } from './platform-user.service';
import { PlatformSessionGuard } from '../../guards/platform-session.guard';
import { ResponseCode } from '../common/api-response.interface';
import { I18nService } from 'nestjs-i18n';
import { AuditTenantLogService } from '../audit/audit-tenant-log.service';

/**
 * 平台超级管理员控制器
 * 提供管理员的增删查改接口，并记录操作审计日志
 */
@Controller('platform/admins')
@UseGuards(PlatformSessionGuard)
export class PlatformAdminController {
  /**
   * 构造函数，注入用户服务、i18n、审计服务
   */
  constructor(
    private readonly userService: PlatformUserService,
    private readonly i18n: I18nService,
    private readonly auditTenantLogService: AuditTenantLogService,
  ) {}

  /**
   * 创建超级管理员账号
   * @param req 请求对象，包含当前用户信息
   * @param dto 创建数据（用户名、密码）
   * @returns 创建结果，含国际化消息
   */
  @Post()
  async create(@Req() req, @Body() dto) {
    const result = await this.userService.createAdmin(
      dto.username,
      dto.password,
    );
    await this.auditTenantLogService.audit({
      operation: 'create_admin',
      superAdminUsername: req.user.username,
      operatorContext: JSON.stringify(dto),
    });
    return {
      code: ResponseCode.SUCCESS,
      msg: this.i18n.t('platform.user.create_success'),
      data: result,
    };
  }

  /**
   * 删除超级管理员账号
   * @param req 请求对象，包含当前用户信息
   * @param id 目标用户ID
   * @returns 删除结果，含国际化消息
   */
  @Delete(':id')
  async delete(@Req() req, @Param('id') id: string) {
    const result = await this.userService.deleteAdmin(id, req.user.id);
    await this.auditTenantLogService.audit({
      operation: 'delete_admin',
      superAdminUsername: req.user.username,
    });
    return {
      code: ResponseCode.SUCCESS,
      msg: this.i18n.t('platform.user.delete_success'),
      data: result,
    };
  }

  /**
   * 查询所有超级管理员账号
   * @param req 请求对象，包含当前用户信息
   * @returns 用户列表，含国际化消息
   */
  @Get()
  async list(@Req() req) {
    const result = await this.userService.listAdmins();
    await this.auditTenantLogService.audit({
      operation: 'list_admins',
      superAdminUsername: req.user.username,
    });
    return {
      code: ResponseCode.SUCCESS,
      msg: this.i18n.t('platform.user.list_success'),
      data: result,
    };
  }

  /**
   * 根据ID查询超级管理员账号
   * @param req 请求对象，包含当前用户信息
   * @param id 用户ID
   * @returns 用户信息，含国际化消息
   */
  @Get(':id')
  async get(@Req() req, @Param('id') id: string) {
    const result = await this.userService.getAdminById(id);
    await this.auditTenantLogService.audit({
      operation: 'get_admin',
      superAdminUsername: req.user.username,
    });
    return {
      code: ResponseCode.SUCCESS,
      msg: this.i18n.t('platform.user.get_success'),
      data: result,
    };
  }

  /**
   * 更新超级管理员账号信息
   * @param req 请求对象，包含当前用户信息
   * @param id 用户ID
   * @param dto 更新数据
   * @returns 更新结果，含国际化消息
   */
  @Patch(':id')
  async update(@Req() req, @Param('id') id: string, @Body() dto) {
    const result = await this.userService.updateAdmin(id, dto);
    await this.auditTenantLogService.audit({
      operation: 'update_admin',
      superAdminUsername: req.user.username,
      operatorContext: JSON.stringify(dto),
    });
    return {
      code: ResponseCode.SUCCESS,
      msg: this.i18n.t('platform.user.update_success'),
      data: result,
    };
  }
}
