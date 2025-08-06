import { UseGuards, ValidationPipe } from '@nestjs/common';
import { PlatformUserService } from './platform-user.service';
import { PlatformSessionGuard } from '../../guards/platform-session.guard';
import { ResponseCode } from '@app/shared-dto-lib';
import { AuditTenantLogService } from '../audit/audit-tenant-log.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  ChangeAdminPasswordDto,
  CreateAdminDto,
  DeleteAdminDto,
} from '@app/shared-dto-lib';
/**
 * 平台超级管理员控制器
 * 提供管理员的增删查改接口，并记录操作审计日志
 */
@UseGuards(PlatformSessionGuard)
export class PlatformAdminController {
  /**
   * 构造函数，注入用户服务、i18n、审计服务
   */
  constructor(
    private readonly userService: PlatformUserService,
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
    @Payload(new ValidationPipe())
    payload: CreateAdminDto,
  ) {
    const result = await this.userService.createAdmin(
      payload.username,
      payload.password,
    );
    await this.auditTenantLogService.audit({
      operation: 'create_admin',
      superAdminUsername: payload.username,
      operatorContext: JSON.stringify(payload),
    });
    return {
      code: ResponseCode.SUCCESS,
      msg: 'platform.user.create_success',
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
  async delete(@Payload() payload: DeleteAdminDto) {
    await this.userService.deleteAdmin(payload.id, payload.user.id);
    await this.auditTenantLogService.audit({
      operation: 'delete_admin',
      superAdminUsername: payload.user.username,
      operatorContext: JSON.stringify(payload),
    });
    return {
      code: ResponseCode.SUCCESS,
      msg: 'platform.user.delete_success',
      data: true,
    };
  }

  /**
   * 查询所有超级管理员账号
   * @param req 请求对象，包含当前用户信息
   * @returns 用户列表，含国际化消息
   */
  @MessagePattern('listAdmins')
  async list(@Payload() payload) {
    const result = await this.userService.listAdmins();
    await this.auditTenantLogService.audit({
      operation: 'list_admins',
      superAdminUsername: payload.user.username,
    });
    return {
      code: ResponseCode.SUCCESS,
      msg: 'platform.user.list_success',
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
  @MessagePattern('changePassword')
  async update(@Payload() payload: ChangeAdminPasswordDto) {
    await this.userService.changeAdminPassword(payload.id, payload.password);
    await this.auditTenantLogService.audit({
      operation: 'change_admin_password',
      superAdminUsername: payload.user.username,
      operatorContext: JSON.stringify(payload),
    });
    return {
      code: ResponseCode.SUCCESS,
      msg: 'platform.user.change_password_success',
      data: true,
    };
  }
}
