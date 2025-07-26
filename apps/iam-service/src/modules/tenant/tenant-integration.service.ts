import { Injectable } from '@nestjs/common';
import { AppLogger } from '@app/logger-lib';
import { RedisLibService } from '@app/redis-lib';

/**
 * 租户信息接口
 */
export interface TenantInfo {
  id: number;
  name: string;
  slug: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 租户配额信息接口
 */
export interface TenantQuota {
  maxUsers: number;
  maxRoles: number;
  maxGroups: number;
  currentUsers: number;
  currentRoles: number;
  currentGroups: number;
}

/**
 * 租户集成服务
 * 负责与platform-core服务进行通信，获取租户相关信息
 * 目前使用Redis缓存作为临时实现，实际应该通过微服务调用
 */
@Injectable()
export class TenantIntegrationService {
  private readonly TENANT_CACHE_PREFIX = 'iam:tenant:';
  private readonly TENANT_QUOTA_PREFIX = 'iam:tenant:quota:';

  constructor(
    private readonly logger: AppLogger,
    private readonly redisService: RedisLibService,
  ) {
    this.logger.setContext('TenantIntegrationService');
  }

  /**
   * 根据租户标识获取租户信息
   * @param tenantSlug 租户标识
   * @returns 租户信息
   */
  async getTenantBySlug(tenantSlug: string): Promise<TenantInfo | null> {
    try {
      const cacheKey = `${this.TENANT_CACHE_PREFIX}${tenantSlug}`;

      // 先从缓存获取
      const cachedTenant = await this.redisService.get(cacheKey);
      if (cachedTenant) {
        return JSON.parse(cachedTenant);
      }

      // 缓存未命中，这里应该调用platform-core服务
      // 暂时返回模拟数据，实际实现时需要集成微服务调用
      const mockTenant: TenantInfo = {
        id: 1,
        name: '测试租户',
        slug: tenantSlug,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 缓存租户信息（5分钟）
      await this.redisService.set(cacheKey, JSON.stringify(mockTenant), 300);

      return mockTenant;
    } catch (error) {
      this.logger.error('Failed to get tenant by slug', error);
      return null;
    }
  }

  /**
   * 验证租户状态
   * @param tenantId 租户ID
   * @returns 租户是否有效
   */
  async validateTenantStatus(tenantId: number): Promise<boolean> {
    try {
      const cacheKey = `${this.TENANT_CACHE_PREFIX}id:${tenantId}`;

      // 先从缓存获取
      const cachedTenant = await this.redisService.get(cacheKey);
      if (cachedTenant) {
        const tenant = JSON.parse(cachedTenant);
        return tenant.status === 'active';
      }

      // 缓存未命中，这里应该调用platform-core服务
      // 暂时返回true，实际实现时需要集成微服务调用
      return true;
    } catch (error) {
      this.logger.error('Failed to validate tenant status', error);
      return false;
    }
  }

  /**
   * 获取租户配额信息
   * @param tenantId 租户ID
   * @returns 租户配额信息
   */
  async getTenantQuota(tenantId: number): Promise<TenantQuota | null> {
    try {
      const cacheKey = `${this.TENANT_QUOTA_PREFIX}${tenantId}`;

      // 先从缓存获取
      const cachedQuota = await this.redisService.get(cacheKey);
      if (cachedQuota) {
        return JSON.parse(cachedQuota);
      }

      // 缓存未命中，这里应该调用platform-core服务
      // 暂时返回模拟数据，实际实现时需要集成微服务调用
      const mockQuota: TenantQuota = {
        maxUsers: 100,
        maxRoles: 20,
        maxGroups: 10,
        currentUsers: 5,
        currentRoles: 3,
        currentGroups: 2,
      };

      // 缓存配额信息（10分钟）
      await this.redisService.set(cacheKey, JSON.stringify(mockQuota), 600);

      return mockQuota;
    } catch (error) {
      this.logger.error('Failed to get tenant quota', error);
      return null;
    }
  }

  /**
   * 检查租户配额是否足够
   * @param tenantId 租户ID
   * @param resourceType 资源类型（users, roles, groups）
   * @param count 需要检查的数量
   * @returns 配额是否足够
   */
  async checkTenantQuota(
    tenantId: number,
    resourceType: 'users' | 'roles' | 'groups',
    count: number = 1,
  ): Promise<boolean> {
    try {
      const quota = await this.getTenantQuota(tenantId);
      if (!quota) {
        return false;
      }

      switch (resourceType) {
        case 'users':
          return quota.currentUsers + count <= quota.maxUsers;
        case 'roles':
          return quota.currentRoles + count <= quota.maxRoles;
        case 'groups':
          return quota.currentGroups + count <= quota.maxGroups;
        default:
          return false;
      }
    } catch (error) {
      this.logger.error('Failed to check tenant quota', error);
      return false;
    }
  }

  /**
   * 更新租户资源使用量
   * @param tenantId 租户ID
   * @param resourceType 资源类型
   * @param delta 变化量（正数增加，负数减少）
   */
  async updateTenantResourceUsage(
    tenantId: number,
    resourceType: 'users' | 'roles' | 'groups',
    delta: number,
  ): Promise<void> {
    try {
      const cacheKey = `${this.TENANT_QUOTA_PREFIX}${tenantId}`;
      const cachedQuota = await this.redisService.get(cacheKey);

      if (cachedQuota) {
        const quota: TenantQuota = JSON.parse(cachedQuota);

        switch (resourceType) {
          case 'users':
            quota.currentUsers = Math.max(0, quota.currentUsers + delta);
            break;
          case 'roles':
            quota.currentRoles = Math.max(0, quota.currentRoles + delta);
            break;
          case 'groups':
            quota.currentGroups = Math.max(0, quota.currentGroups + delta);
            break;
        }

        // 更新缓存
        await this.redisService.set(cacheKey, JSON.stringify(quota), 600);
      }

      // 这里应该调用platform-core服务更新实际数据
      this.logger.log(`Updated tenant resource usage`);
    } catch (error) {
      this.logger.error('Failed to update tenant resource usage', error);
    }
  }

  /**
   * 清除租户缓存
   * @param tenantSlug 租户标识
   */
  async clearTenantCache(tenantSlug: string): Promise<void> {
    try {
      const tenantCacheKey = `${this.TENANT_CACHE_PREFIX}${tenantSlug}`;
      await this.redisService.del(tenantCacheKey);

      this.logger.log(`Cleared tenant cache`);
    } catch (error) {
      this.logger.error('Failed to clear tenant cache', error);
    }
  }

  /**
   * 清除租户配额缓存
   * @param tenantId 租户ID
   */
  async clearTenantQuotaCache(tenantId: number): Promise<void> {
    try {
      const quotaCacheKey = `${this.TENANT_QUOTA_PREFIX}${tenantId}`;
      await this.redisService.del(quotaCacheKey);

      this.logger.log(`Cleared tenant quota cache`);
    } catch (error) {
      this.logger.error('Failed to clear tenant quota cache', error);
    }
  }
}
