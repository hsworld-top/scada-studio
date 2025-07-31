import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TenantQuota, TenantStatus } from '@app/shared-dto-lib';
import { Repository } from 'typeorm';
import { Tenant } from './platform-tenant.entity';

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
        quota: {
          maxUsers: 10,
          maxRoles: 5,
          maxGroups: 5,
          maxProjects: 20,
        },
      });
      // TODO: 调用iam-service创建默认管理员
    }
  }

  /**
   * 创建租户（自动生成租户标识 + 创建初始管理员）
   * @param param0 包含 name 和 slug
   * @returns 创建的租户实体
   */
  async createTenant(name: string, slug: string, quota: TenantQuota) {
    if (await this.tenantRepository.findOne({ where: { slug } })) {
      throw new Error('tenant_already_exists');
    }
    if (await this.tenantRepository.findOne({ where: { name } })) {
      throw new Error('tenant_already_exists');
    }
    // 最大用户默认值为10, 最大角色默认值为5, 最大组默认值为5, 最大项目默认值为20
    if (!quota || Object.keys(quota).length === 0) {
      quota = {
        maxUsers: 10,
        maxRoles: 5,
        maxGroups: 5,
        maxProjects: 20,
      };
    }
    const tenant = await this.tenantRepository.save({
      name,
      slug,
      status: TenantStatus.ACTIVE,
      quota,
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
      quota: tenant.quota,
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
    quota: TenantQuota,
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
    if (quota && Object.keys(quota).length > 0) {
      tenant.quota = quota;
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
