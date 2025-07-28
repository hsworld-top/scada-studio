import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './platform-tenant.entity';
import { AuditTenantLogService } from '../audit/audit-tenant-log.service';
import { TenantStatus } from '@app/shared-dto-lib';
import { PlatformUser } from '../platform-user/platform-user.entity';

/**
 * TenantService 租户管理服务
 * 提供租户的增删改查、状态管理及服务初始化时自动创建默认租户的功能
 */
@Injectable()
export class TenantService implements OnModuleInit {
  /**
   * 构造函数，注入租户和用户实体的 TypeORM 仓库
   */
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(PlatformUser)
    private readonly userRepository: Repository<PlatformUser>,
    private readonly auditTenantLogService: AuditTenantLogService,
  ) {}

  /**
   * 服务初始化钩子
   * 启动时自动检查并创建默认租户（仅在租户表为空时）
   */
  async onModuleInit() {
    // 检查是否已有租户
    const count = await this.tenantRepository.count();
    if (count === 0) {
      await this.tenantRepository.save({
        name: 'default',
        slug: 'default',
        status: TenantStatus.ACTIVE,
      });
    }
  }

  /**
   * 创建租户（自动生成租户标识 + 创建初始管理员）
   * @param param0 包含 name 和 slug
   * @returns 创建的租户实体
   */
  async createTenant(name: string, slug: string) {
    if (await this.tenantRepository.findOne({ where: { slug } })) {
      throw new Error('tenant_already_exists');
    }
    if (await this.tenantRepository.findOne({ where: { name } })) {
      throw new Error('tenant_already_exists');
    }
    const tenant = await this.tenantRepository.save({
      name,
      slug,
      status: TenantStatus.ACTIVE,
    });

    return tenant;
  }

  /**
   * 删除租户
   * @param id 租户ID
   * @returns 被删除的租户实体
   * @throws tenant_not_found 未找到租户
   */
  async deleteTenant(id: number) {
    const tenant = await this.tenantRepository.findOne({ where: { id } });
    if (!tenant) {
      throw new Error('tenant_not_found');
    }
    await this.tenantRepository.delete(tenant.id);
    return tenant;
  }

  /**
   * 查询所有租户
   * @returns 租户信息数组
   */
  async listTenants() {
    const tenants = await this.tenantRepository.find();
    return tenants.map((tenant) => ({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      status: tenant.status,
    }));
  }

  /**
   * 更新租户信息
   * @param id 租户ID
   * @param name 租户名称
   * @param slug 租户标识
   * @param status 租户状态
   * @returns 更新结果
   */
  async updateTenant(
    id: number,
    name: string,
    slug: string,
    status: TenantStatus,
  ) {
    const tenant = await this.tenantRepository.findOne({ where: { id } });
    if (!tenant) {
      throw new Error('tenant_not_found');
    }
    if (name) {
      tenant.name = name;
    }
    if (slug) {
      tenant.slug = slug;
    }
    if (status) {
      tenant.status = status;
    }
    return this.tenantRepository.save(tenant);
  }
  /**
   * 获取租户信息
   * @param id 租户ID
   * @returns 租户信息
   * @throws tenant_not_found 未找到租户
   */
  async getTenant(id: number) {
    const tenant = await this.tenantRepository.findOne({ where: { id } });
    if (!tenant) {
      throw new Error('tenant_not_found');
    }
    return tenant;
  }

  /**
   * 根据租户标识获取租户信息
   * @param slug 租户标识
   * @returns 租户信息
   */
  async getTenantBySlug(slug: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { slug },
    });

    if (!tenant) {
      throw new Error('tenant_not_found');
    }

    return tenant;
  }
}
