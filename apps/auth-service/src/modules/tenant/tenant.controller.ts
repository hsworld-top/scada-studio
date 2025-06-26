import { Controller, ValidationPipe, UseGuards } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TenantService } from './tenant.service';
import { TenantStatus } from './entities/tenant.entity';
import { PermissionsGuard } from '../../common/guards/permissions/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions/require-permissions.decorator';

/**
 * TenantController 负责处理租户相关的微服务消息接口。
 */
@Controller('tenants')
@UseGuards(PermissionsGuard)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  /**
   * 创建租户
   * @param payload { name, slug }
   */
  @MessagePattern('tenant.create')
  @RequirePermissions({ resource: 'tenant', action: 'create' })
  create(@Payload(new ValidationPipe()) payload: { name: string; slug: string }) {
    return this.tenantService.createTenant(payload.name, payload.slug);
  }

  /**
   * 更新租户
   * @param payload { id, name, slug }
   */
  @MessagePattern('tenant.update')
  @RequirePermissions({ resource: 'tenant', action: 'update' })
  update(@Payload(new ValidationPipe()) payload: { id: number; name: string; slug: string }) {
    return this.tenantService.updateTenant(payload.id, payload.name, payload.slug);
  }

  /**
   * 删除租户
   * @param payload { id }
   */
  @MessagePattern('tenant.delete')
  @RequirePermissions({ resource: 'tenant', action: 'delete' })
  async delete(@Payload(new ValidationPipe()) payload: { id: number }) {
    await this.tenantService.deleteTenant(payload.id);
    return { success: true };
  }

  /**
   * 查询单个租户
   * @param payload { id }
   */
  @MessagePattern('tenant.findById')
  @RequirePermissions({ resource: 'tenant', action: 'read' })
  findById(@Payload(new ValidationPipe()) payload: { id: number }) {
    return this.tenantService.findTenantById(payload.id);
  }

  /**
   * 查询所有租户
   */
  @MessagePattern('tenant.findAll')
  @RequirePermissions({ resource: 'tenant', action: 'read' })
  findAll() {
    return this.tenantService.findAllTenants();
  }

  /**
   * 修改租户状态
   * @param payload { id, status }
   */
  @MessagePattern('tenant.changeStatus')
  @RequirePermissions({ resource: 'tenant', action: 'update' })
  changeStatus(@Payload(new ValidationPipe()) payload: { id: number; status: TenantStatus }) {
    return this.tenantService.changeStatus(payload.id, payload.status);
  }
} 