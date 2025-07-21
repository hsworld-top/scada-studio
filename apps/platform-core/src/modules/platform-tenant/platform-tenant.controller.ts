import { UseGuards } from '@nestjs/common';
import { CreateTenantDto, UpdateTenantDto } from '@app/shared-dto-lib';
import { PlatformSessionGuard } from '../../guards/platform-session.guard';
import { ResponseCode } from '../../common/api-response.interface';
import { TenantService } from './platform-tenant.service';
import { AuditTenantLogService } from '../audit/audit-tenant-log.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';

/**
 * 租户管理控制器
 * 提供租户的增删查改接口，并记录操作审计日志
 */
@UseGuards(PlatformSessionGuard)
export class TenantController {
  /**
   * 构造函数，注入租户服务、i18n、审计服务
   */
  constructor(
    private readonly tenantService: TenantService,
    private readonly auditTenantLogService: AuditTenantLogService,
  ) {}

  /**
   * 创建租户
   * @param req 请求对象，包含当前用户信息
   * @param payload 创建数据
   * @returns 创建结果，含国际化消息
   */
  @MessagePattern('createTenant')
  async create(
    @Payload(new ValidationPipe())
    payload: CreateTenantDto & { user: { username: string } },
  ) {
    const result = await this.tenantService.createTenant(
      payload.name,
      payload.slug,
    );
    await this.auditTenantLogService.audit({
      operation: 'create_tenant',
      superAdminUsername: payload.user.username,
      operatorContext: JSON.stringify(payload),
    });
    return {
      code: ResponseCode.SUCCESS,
      msg: 'platform.tenant.create_success',
      data: result,
    };
  }

  /**
   * 删除租户
   * @param req 请求对象，包含当前用户信息
   * @param id 租户ID
   * @returns 删除结果，含国际化消息
   */
  @MessagePattern('deleteTenant')
  async delete(
    @Payload(new ValidationPipe())
    payload: {
      id: number;
      user: { username: string };
    },
  ) {
    const result = await this.tenantService.deleteTenant(payload.id);
    await this.auditTenantLogService.audit({
      operation: 'delete_tenant',
      superAdminUsername: payload.user.username,
      operatorContext: JSON.stringify(result),
    });
    return {
      code: ResponseCode.SUCCESS,
      msg: 'platform.tenant.delete_success',
      data: result,
    };
  }

  /**
   * 查询所有租户
   * @param req 请求对象，包含当前用户信息
   * @returns 租户列表，含国际化消息
   */
  @MessagePattern('listTenants')
  async list(@Payload() payload: { user: { username: string } }) {
    const result = await this.tenantService.listTenants();
    await this.auditTenantLogService.audit({
      operation: 'list_tenants',
      superAdminUsername: payload.user.username,
    });
    return {
      code: ResponseCode.SUCCESS,
      msg: 'platform.tenant.list_success',
      data: result,
    };
  }
  /**
   * 获取租户信息
   * @param req 请求对象，包含当前用户信息
   * @param id 租户ID
   * @returns 租户信息，含国际化消息
   */
  @MessagePattern('getTenant')
  async get(@Payload() payload: { id: number; user: { username: string } }) {
    const result = await this.tenantService.getTenant(payload.id);
    await this.auditTenantLogService.audit({
      operation: 'get_tenant',
      superAdminUsername: payload.user.username,
      operatorContext: JSON.stringify(payload),
    });
    return {
      code: ResponseCode.SUCCESS,
      msg: 'platform.tenant.get_success',
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
  @MessagePattern('updateTenant')
  async update(
    @Payload(new ValidationPipe())
    payload: UpdateTenantDto & { user: { username: string }; id: number },
  ) {
    const result = await this.tenantService.updateTenant(
      payload.id,
      payload.name,
      payload.slug,
      payload.status,
    );
    await this.auditTenantLogService.audit({
      operation: 'update_tenant',
      superAdminUsername: payload.user.username,
      operatorContext: JSON.stringify(payload),
    });
    return {
      code: ResponseCode.SUCCESS,
      msg: 'platform.tenant.update_success',
      data: result,
    };
  }
}
