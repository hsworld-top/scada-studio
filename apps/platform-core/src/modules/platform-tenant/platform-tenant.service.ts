import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './platform-tenant.entity';
import { AuditTenantLogService } from '../audit/audit-tenant-log.service';
import { TenantStatus, UpdateTenantDto, UserStatus } from '@app/shared-dto-lib';
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
  async createTenant({ name, slug }) {
    const tenant = await this.tenantRepository.save({
      name,
      slug,
      status: TenantStatus.ACTIVE,
    });

    // 自动创建初始管理员账号（用户名、密码从环境变量读取）
    await this.userRepository.save({
      username: process.env.SUPER_ADMIN_USERNAME,
      passwordHash: process.env.SUPER_ADMIN_PASSWORD,
      status: UserStatus.ACTIVE,
      currentSessionId: '',
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
   * @param payload 更新数据
   * @returns 更新结果
   */
  async updateTenant(id: number, payload: UpdateTenantDto) {
    return this.tenantRepository.update(id, {
      name: payload.name,
      slug: payload.slug,
    });
  }
}
