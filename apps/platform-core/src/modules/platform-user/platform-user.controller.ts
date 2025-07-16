import { Controller, UseGuards } from '@nestjs/common';
import { PlatformUserService } from './platform-user.service';
import { PlatformSessionGuard } from '../../guards/platform-session.guard';
import { ResponseCode } from '../common/api-response.interface';
import { I18nService } from 'nestjs-i18n';
import { AuditTenantLogService } from '../audit/audit-tenant-log.service';
import { MessagePattern, Payload } from '@nestjs/microservices';

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
  @MessagePattern('createAdmin')
  async create(
    @Payload()
    payload: {
      dto: { username: string; password: string };
      user: { username: string };
    },
  ) {
    const result = await this.userService.createAdmin(
      payload.dto.username,
      payload.dto.password,
    );
    await this.auditTenantLogService.audit({
      operation: 'create_admin',
      superAdminUsername: payload.user.username,
      operatorContext: JSON.stringify(payload.dto),
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
  @MessagePattern('deleteAdmin')
  async delete(
    @Payload()
    payload: {
      id: string;
      user: { username: string; id: number };
    },
  ) {
    const result = await this.userService.deleteAdmin(
      payload.id,
      payload.user.id.toString(),
    );
    await this.auditTenantLogService.audit({
      operation: 'delete_admin',
      superAdminUsername: payload.user.username,
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
  @MessagePattern('listAdmins')
  async list(@Payload() payload: { user: { username: string } }) {
    const result = await this.userService.listAdmins();
    await this.auditTenantLogService.audit({
      operation: 'list_admins',
      superAdminUsername: payload.user.username,
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
  @MessagePattern('getAdmin')
  async get(
    @Payload()
    payload: {
      id: string;
      user: { username: string; id: number };
    },
  ) {
    const result = await this.userService.getAdminById(payload.id);
    await this.auditTenantLogService.audit({
      operation: 'get_admin',
      superAdminUsername: payload.user.username,
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
  @MessagePattern('updateAdmin')
  async update(
    @Payload()
    payload: {
      id: string;
      dto: any;
      user: { username: string };
    },
  ) {
    const result = await this.userService.updateAdmin(payload.id, payload.dto);
    await this.auditTenantLogService.audit({
      operation: 'update_admin',
      superAdminUsername: payload.user.username,
      operatorContext: JSON.stringify(payload.dto),
    });
    return {
      code: ResponseCode.SUCCESS,
      msg: this.i18n.t('platform.user.update_success'),
      data: result,
    };
  }
}
