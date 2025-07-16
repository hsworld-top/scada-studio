import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity';
import { TenantStatus } from '@app/shared-dto-lib';
import { TenantInitializerService } from './tenant-initializer.service';
import { I18nService } from 'nestjs-i18n';
import { AuditLogService } from '../audit/audit-log.service';

/**
 * TenantService 提供租户的增删改查和状态管理逻辑。
 */
@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly tenantInitializerService: TenantInitializerService,
    private readonly i18n: I18nService,
    private readonly auditLogService: AuditLogService,
  ) {}

  /**
   * 创建新租户。
   * @param name 租户名称
   * @param slug 租户唯一标识符
   */
  async createTenant(
    name: string,
    slug: string,
    operatorId?: number,
  ): Promise<Tenant> {
    // 检查名称和slug唯一性
    const exist = await this.tenantRepository.findOne({
      where: [{ name }, { slug }],
    });
    if (exist) {
      throw new BadRequestException(this.i18n.t('auth.tenant_exists'));
    }
    const tenant = this.tenantRepository.create({ name, slug });
    const newTenant = await this.tenantRepository.save(tenant);
    // 新建租户后初始化角色、策略和超级管理员
    await this.tenantInitializerService.initTenantData(newTenant);
    await this.auditLogService.audit({
      userId: operatorId,
      action: 'create',
      resource: 'tenant',
      targetId: newTenant.id.toString(),
      detail: { name, slug },
      result: 'success',
    });
    return newTenant;
  }

  /**
   * 更新租户信息。
   * @param id 租户ID
   * @param name 新名称
   * @param slug 新标识符
   */
  async updateTenant(
    id: number,
    name: string,
    slug: string,
    operatorId?: number,
  ): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({ where: { id } });
    if (!tenant)
      throw new NotFoundException(this.i18n.t('auth.tenant_not_found'));
    tenant.name = name;
    tenant.slug = slug;
    await this.auditLogService.audit({
      userId: operatorId,
      action: 'update',
      resource: 'tenant',
      targetId: id.toString(),
      detail: { name, slug },
      result: 'success',
    });
    return this.tenantRepository.save(tenant);
  }

  /**
   * 删除租户（物理删除）。
   * @param id 租户ID
   */
  async deleteTenant(id: number, operatorId?: number): Promise<void> {
    const result = await this.tenantRepository.delete(id);
    if (result.affected === 0)
      throw new NotFoundException(this.i18n.t('auth.tenant_not_found'));
    await this.auditLogService.audit({
      userId: operatorId,
      action: 'delete',
      resource: 'tenant',
      targetId: id.toString(),
      result: 'success',
    });
  }

  /**
   * 查询单个租户。
   * @param id 租户ID
   */
  async findTenantById(id: number): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({ where: { id } });
    if (!tenant)
      throw new NotFoundException(this.i18n.t('auth.tenant_not_found'));
    return tenant;
  }

  /**
   * 查询所有租户。
   */
  async findAllTenants(): Promise<Tenant[]> {
    return this.tenantRepository.find();
  }

  /**
   * 修改租户状态。
   * @param id 租户ID
   * @param status 新状态
   */
  async changeStatus(
    id: number,
    status: TenantStatus,
    operatorId?: number,
  ): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({ where: { id } });
    if (!tenant)
      throw new NotFoundException(this.i18n.t('auth.tenant_not_found'));
    tenant.status = status;
    await this.auditLogService.audit({
      userId: operatorId,
      action: 'changeStatus',
      resource: 'tenant',
      targetId: id.toString(),
      detail: { status },
      result: 'success',
    });
    return this.tenantRepository.save(tenant);
  }
}
