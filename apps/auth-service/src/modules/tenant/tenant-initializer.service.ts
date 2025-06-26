import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { Role } from '../user/entities/role.entity';
import { Tenant } from './entities/tenant.entity';
import { CasbinService } from '../casbin/casbin.service';
import { AppLogger } from '@app/logger-lib';

@Injectable()
export class TenantInitializerService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Role) private roleRepository: Repository<Role>,
    private casbinService: CasbinService,
    private readonly logger: AppLogger,
  ) {}

  /**
   * 初始化租户的基础角色、权限策略和超级管理员账号。
   * @param tenant 新建的租户实体
   */
  async initTenantData(tenant: Tenant) {
    const tenantId = tenant.id;
    const tenantIdStr = tenant.id.toString();
    const rolesToSeed = ['super-admin', 'developer'];
    const existingRolesCount = await this.roleRepository.count({ where: { tenantId } });
    if (existingRolesCount === 0) {
      this.logger.log(`Seeding initial roles for tenant ${tenantId}...`);
      const roleEntities = rolesToSeed.map((name) => ({ name, tenantId, description: `The ${name} role` }));
      await this.roleRepository.save(roleEntities);
      this.logger.log('Initial roles seeded.');
    }
    const enforcer = this.casbinService.getEnforcer();
    const initialPolicies = [
      ['super-admin', tenantIdStr, 'all', 'manage'],
      ['super-admin', tenantIdStr, 'user', 'create'],
      ['super-admin', tenantIdStr, 'user', 'read'],
      ['super-admin', tenantIdStr, 'user', 'update'],
      ['super-admin', tenantIdStr, 'user', 'delete'],
      ['super-admin', tenantIdStr, 'user', 'manage_status'],
      ['super-admin', tenantIdStr, 'role', 'create'],
      ['super-admin', tenantIdStr, 'role', 'read'],
      ['super-admin', tenantIdStr, 'role', 'update'],
      ['super-admin', tenantIdStr, 'role', 'delete'],
      ['super-admin', tenantIdStr, 'group', 'create'],
      ['super-admin', tenantIdStr, 'group', 'read'],
      ['super-admin', tenantIdStr, 'group', 'update'],
      ['super-admin', tenantIdStr, 'group', 'delete'],
      ['super-admin', tenantIdStr, 'permission', 'manage'],
      ['super-admin', tenantIdStr, 'tenant', 'create'],
      ['super-admin', tenantIdStr, 'tenant', 'update'],
      ['super-admin', tenantIdStr, 'tenant', 'delete'],
      ['super-admin', tenantIdStr, 'tenant', 'read'],
      ['developer', tenantIdStr, 'workbench', 'access'],
      ['developer', tenantIdStr, 'project', 'manage'],
    ];
    for (const p of initialPolicies) {
      if (!(await enforcer.hasPolicy(...p))) {
        await enforcer.addPolicy(...p);
      }
    }
    const adminExists = await this.userRepository.findOne({ where: { username: 'admin', tenantId } });
    if (!adminExists) {
      this.logger.log(`Seeding super admin for tenant ${tenantId}...`);
      await this.userRepository.save(this.userRepository.create({
        username: 'admin',
        password: process.env.ADMIN_PASSWORD || 'admin123',
        tenantId,
        roles: await this.roleRepository.find({ where: { name: 'super-admin', tenantId } }),
      }));
      this.logger.log('Super admin seeded.');
    }
  }
}
