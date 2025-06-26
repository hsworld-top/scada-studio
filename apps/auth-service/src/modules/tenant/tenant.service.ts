import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant, TenantStatus } from './entities/tenant.entity';
import { TenantInitializerService } from './tenant-initializer.service';

/**
 * TenantService 提供租户的增删改查和状态管理逻辑。
 */
@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly tenantInitializerService: TenantInitializerService,
  ) {}

  /**
   * 创建新租户。
   * @param name 租户名称
   * @param slug 租户唯一标识符
   */
  async createTenant(name: string, slug: string): Promise<Tenant> {
    // 检查名称和slug唯一性
    const exist = await this.tenantRepository.findOne({ where: [{ name }, { slug }] });
    if (exist) {
      throw new BadRequestException('租户名称或标识符已存在');
    }
    const tenant = this.tenantRepository.create({ name, slug });
    const newTenant = await this.tenantRepository.save(tenant);
    // 新建租户后初始化角色、策略和超级管理员
    await this.tenantInitializerService.initTenantData(newTenant);
    return newTenant;
  }

  /**
   * 更新租户信息。
   * @param id 租户ID
   * @param name 新名称
   * @param slug 新标识符
   */
  async updateTenant(id: number, name: string, slug: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({ where: { id } });
    if (!tenant) throw new NotFoundException('租户不存在');
    tenant.name = name;
    tenant.slug = slug;
    return this.tenantRepository.save(tenant);
  }

  /**
   * 删除租户（物理删除）。
   * @param id 租户ID
   */
  async deleteTenant(id: number): Promise<void> {
    const result = await this.tenantRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('租户不存在');
  }

  /**
   * 查询单个租户。
   * @param id 租户ID
   */
  async findTenantById(id: number): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({ where: { id } });
    if (!tenant) throw new NotFoundException('租户不存在');
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
  async changeStatus(id: number, status: TenantStatus): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({ where: { id } });
    if (!tenant) throw new NotFoundException('租户不存在');
    tenant.status = status;
    return this.tenantRepository.save(tenant);
  }
}