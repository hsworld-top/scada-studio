import { Controller, ValidationPipe, UseGuards } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TenantService } from './tenant.service';
import { PermissionsGuard } from '../../common/guards/permissions/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions/require-permissions.decorator';
import {
  CreateTenantDto,
  UpdateTenantDto,
  DeleteTenantDto,
  FindTenantByIdDto,
  ChangeTenantStatusDto,
} from '@app/shared-dto-lib';
import { I18nService } from 'nestjs-i18n';

/**
 * TenantController 负责处理租户相关的微服务消息接口。
 */
@Controller('tenants')
@UseGuards(PermissionsGuard)
export class TenantController {
  constructor(
    private readonly tenantService: TenantService,
    private readonly i18n: I18nService,
  ) {}

  /**
   * 创建租户
   * @param payload { name, slug }
   */
  @MessagePattern('tenant.create')
  @RequirePermissions({ resource: 'tenant', action: 'create' })
  async create(@Payload(new ValidationPipe()) payload: CreateTenantDto) {
    try {
      const result = await this.tenantService.createTenant(
        payload.name,
        payload.slug,
      );
      return {
        code: 0,
        msg: this.i18n.t('auth.success'),
        data: result,
      };
    } catch (error) {
      return this.handleTenantError(error);
    }
  }

  /**
   * 更新租户
   * @param payload { id, name, slug }
   */
  @MessagePattern('tenant.update')
  @RequirePermissions({ resource: 'tenant', action: 'update' })
  async update(@Payload(new ValidationPipe()) payload: UpdateTenantDto) {
    try {
      const result = await this.tenantService.updateTenant(
        payload.id,
        payload.name,
        payload.slug,
      );
      return {
        code: 0,
        msg: this.i18n.t('auth.success'),
        data: result,
      };
    } catch (error) {
      return this.handleTenantError(error);
    }
  }

  /**
   * 删除租户
   * @param payload { id }
   */
  @MessagePattern('tenant.delete')
  @RequirePermissions({ resource: 'tenant', action: 'delete' })
  async delete(@Payload(new ValidationPipe()) payload: DeleteTenantDto) {
    try {
      await this.tenantService.deleteTenant(payload.id);
      return {
        code: 0,
        msg: this.i18n.t('auth.success'),
        data: { success: true },
      };
    } catch (error) {
      return this.handleTenantError(error);
    }
  }

  /**
   * 查询单个租户
   * @param payload { id }
   */
  @MessagePattern('tenant.findById')
  @RequirePermissions({ resource: 'tenant', action: 'read' })
  async findById(@Payload(new ValidationPipe()) payload: FindTenantByIdDto) {
    try {
      const result = await this.tenantService.findTenantById(payload.id);
      return {
        code: 0,
        msg: this.i18n.t('auth.success'),
        data: result,
      };
    } catch (error) {
      return this.handleTenantError(error);
    }
  }

  /**
   * 查询所有租户
   */
  @MessagePattern('tenant.findAll')
  @RequirePermissions({ resource: 'tenant', action: 'read' })
  async findAll() {
    try {
      const result = await this.tenantService.findAllTenants();
      return {
        code: 0,
        msg: this.i18n.t('auth.success'),
        data: result,
      };
    } catch (error) {
      return this.handleTenantError(error);
    }
  }

  /**
   * 修改租户状态
   * @param payload { id, status }
   */
  @MessagePattern('tenant.changeStatus')
  @RequirePermissions({ resource: 'tenant', action: 'update' })
  async changeStatus(
    @Payload(new ValidationPipe()) payload: ChangeTenantStatusDto,
  ) {
    try {
      const result = await this.tenantService.changeStatus(
        payload.id,
        payload.status,
      );
      return {
        code: 0,
        msg: this.i18n.t('auth.success'),
        data: result,
      };
    } catch (error) {
      return this.handleTenantError(error);
    }
  }

  /**
   * 统一处理租户相关的错误，返回标准格式
   */
  private handleTenantError(error: any) {
    const message = error?.message || '';

    // 租户相关错误
    if (
      message.includes('tenant_not_found') ||
      message.includes('租户不存在')
    ) {
      return {
        code: 404,
        msg: this.i18n.t('auth.tenant_not_found'),
        data: null,
      };
    }

    if (
      message.includes('tenant_already_exists') ||
      message.includes('租户已存在')
    ) {
      return {
        code: 409,
        msg: this.i18n.t('auth.tenant_already_exists'),
        data: null,
      };
    }

    if (
      message.includes('cannot_delete_tenant') ||
      message.includes('不能删除租户')
    ) {
      return {
        code: 400,
        msg: this.i18n.t('auth.cannot_delete_tenant'),
        data: null,
      };
    }

    if (message.includes('tenant_inactive') || message.includes('租户已停用')) {
      return {
        code: 400,
        msg: this.i18n.t('auth.tenant_inactive'),
        data: null,
      };
    }

    // 权限相关错误
    if (
      message.includes('insufficient_permissions') ||
      message.includes('权限不足')
    ) {
      return {
        code: 403,
        msg: this.i18n.t('auth.insufficient_permissions'),
        data: null,
      };
    }

    // 验证错误
    if (message.includes('validation') || message.includes('验证')) {
      return {
        code: 400,
        msg: message,
        data: null,
      };
    }

    // 默认错误
    return {
      code: 500,
      msg: message || this.i18n.t('auth.service_unavailable'),
      data: null,
    };
  }
}
