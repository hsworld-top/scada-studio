import { Injectable, OnModuleInit } from '@nestjs/common'; // 导入 Injectable 和 OnModuleInit 装饰器
import { Enforcer, newEnforcer } from 'casbin'; // 导入 Enforcer 和 newEnforcer 函数
import { RedisLibService } from '@app/redis-lib'; // 导入 RedisLibService
import { AppLogger } from '@app/logger-lib'; // 导入 AppLogger
import TypeORMAdapter from 'typeorm-adapter'; // 导入 TypeORMAdapter
import { TypeORMAdapterOptions } from 'typeorm-adapter'; // 导入 TypeORMAdapterOptions
import * as path from 'path'; // 导入 path 模块
import { IAM_CACHE_KEYS } from '@app/shared-dto-lib'; // 导入 CACHE_KEYS 常量

@Injectable()
export class CasbinService implements OnModuleInit {
  private readonly context = CasbinService.name; // 设置上下文名称为 CasbinService
  private enforcer: Enforcer; // 定义 enforcer 属性

  constructor(
    private readonly redisService: RedisLibService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(this.context); // 设置日志上下文
  }
  /** */
  async onModuleInit() {
    // 配置数据库连接选项
    const dbOptions: TypeORMAdapterOptions = {
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'iam_db',
      extra: {
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      },
    };

    // Casbin 模型文件路径
    const modelPath = path.join(process.cwd(), 'casbin-model.conf');
    // 创建 TypeORMAdapter 实例
    const adapter = await TypeORMAdapter.newAdapter(dbOptions);
    // 创建 Casbin 实例
    this.enforcer = await newEnforcer(modelPath, adapter);
    // 加载策略
    await this.enforcer.loadPolicy();
    // 日志输出
    this.logger.log('Casbin enforcer has been initialized.');
  }

  /**
   * 获取 Casbin enforcer 实例
   */
  getEnforcer(): Enforcer {
    return this.enforcer;
  }

  /**
   * 检查用户权限（支持多租户）
   */
  async checkPermission(
    userId: string,
    tenantId: string,
    resource: string,
    action: string,
  ): Promise<boolean> {
    // 缓存键
    const cacheKey = `${IAM_CACHE_KEYS.PERMISSION_CACHE}${tenantId}:${userId}:${resource}:${action}`;
    const cachedResult = await this.redisService.get(cacheKey);

    if (cachedResult !== null) {
      return cachedResult === 'true';
    }

    const hasPermission = await this.enforcer.enforce(
      userId,
      tenantId,
      resource,
      action,
    );

    // 缓存权限检查结果
    await this.redisService.set(cacheKey, String(hasPermission), 1800); // 30分钟
    return hasPermission;
  }

  /**
   * 批量检查权限
   */
  async batchCheckPermissions(
    userId: string,
    tenantId: string,
    permissions: Array<{ resource: string; action: string }>,
  ): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    for (const permission of permissions) {
      const key = `${permission.resource}:${permission.action}`;
      results[key] = await this.checkPermission(
        userId,
        tenantId,
        permission.resource,
        permission.action,
      );
    }

    return results;
  }

  /**
   * 为用户添加角色
   */
  async addRoleForUser(
    userId: string,
    role: string,
    tenantId: string,
  ): Promise<boolean> {
    const result = await this.enforcer.addRoleForUser(userId, role, tenantId);
    if (result) {
      await this.clearUserPermissionCache(userId, tenantId);
    }
    return result;
  }

  /**
   * 移除用户角色
   */
  async removeRoleForUser(
    userId: string,
    role: string,
    tenantId: string,
  ): Promise<boolean> {
    const result = await this.enforcer.deleteRoleForUser(
      userId,
      role,
      tenantId,
    );
    if (result) {
      await this.clearUserPermissionCache(userId, tenantId);
    }
    return result;
  }

  /**
   * 获取用户的所有角色
   */
  async getRolesForUser(userId: string, tenantId: string): Promise<string[]> {
    return this.enforcer.getRolesForUser(userId, tenantId);
  }

  /**
   * 获取角色的所有用户
   */
  async getUsersForRole(role: string, tenantId: string): Promise<string[]> {
    return this.enforcer.getUsersForRole(role, tenantId);
  }

  /**
   * 为角色添加权限策略
   */
  async addPolicy(
    role: string,
    tenantId: string,
    resource: string,
    action: string,
  ): Promise<boolean> {
    const result = await this.enforcer.addPolicy(
      role,
      tenantId,
      resource,
      action,
    );
    if (result) {
      await this.clearRolePermissionCache(role, tenantId);
    }
    return result;
  }

  /**
   * 为角色移除权限策略
   */
  async removePolicy(
    role: string,
    tenantId: string,
    resource: string,
    action: string,
  ): Promise<boolean> {
    const result = await this.enforcer.removePolicy(
      role,
      tenantId,
      resource,
      action,
    );
    if (result) {
      await this.clearRolePermissionCache(role, tenantId);
    }
    return result;
  }

  /**
   * 获取角色的所有权限
   */
  async getPermissionsForRole(
    role: string,
    tenantId: string,
  ): Promise<string[][]> {
    return this.enforcer.getFilteredPolicy(0, role, tenantId);
  }

  /**
   * 批量为角色添加权限策略
   */
  async addPolicies(
    policies: Array<[string, string, string, string]>,
  ): Promise<boolean> {
    const result = await this.enforcer.addPolicies(policies);
    if (result) {
      // 清除相关缓存
      const affectedRoles = new Set(policies.map((p) => `${p[1]}:${p[0]}`));
      for (const roleKey of affectedRoles) {
        const [tenantId, role] = roleKey.split(':');
        await this.clearRolePermissionCache(role, tenantId);
      }
    }
    return result;
  }

  /**
   * 批量移除权限策略
   */
  async removePolicies(
    policies: Array<[string, string, string, string]>,
  ): Promise<boolean> {
    const result = await this.enforcer.removePolicies(policies);
    if (result) {
      // 清除相关缓存
      const affectedRoles = new Set(policies.map((p) => `${p[1]}:${p[0]}`));
      for (const roleKey of affectedRoles) {
        const [tenantId, role] = roleKey.split(':');
        await this.clearRolePermissionCache(role, tenantId);
      }
    }
    return result;
  }

  /**
   * 移除角色的所有权限
   */
  async removeFilteredPolicy(role: string, tenantId: string): Promise<boolean> {
    const result = await this.enforcer.removeFilteredPolicy(0, role, tenantId);
    if (result) {
      await this.clearRolePermissionCache(role, tenantId);
    }
    return result;
  }

  /**
   * 删除用户的所有角色和权限
   */
  async deleteUser(userId: string): Promise<boolean> {
    const result = await this.enforcer.deleteUser(userId);
    if (result) {
      // 清除用户相关的所有缓存
      const pattern = `${IAM_CACHE_KEYS.PERMISSION_CACHE}*:${userId}:*`;
      await this.redisService.scanDel(pattern);
    }
    return result;
  }

  /**
   * 删除角色的所有关联
   */
  async deleteRole(role: string): Promise<boolean> {
    const result = await this.enforcer.deleteRole(role);
    if (result) {
      // 清除角色相关的所有缓存
      const pattern = `${IAM_CACHE_KEYS.ROLE_CACHE}*:${role}`;
      await this.redisService.scanDel(pattern);
    }
    return result;
  }

  /**
   * 保存策略到数据库
   */
  async savePolicy(): Promise<boolean> {
    return this.enforcer.savePolicy();
  }

  /**
   * 重新加载策略
   */
  async loadPolicy(): Promise<void> {
    await this.enforcer.loadPolicy();
    // 清除所有权限相关缓存
    await this.clearAllPermissionCache();
  }

  /**
   * 清除用户权限缓存
   */
  private async clearUserPermissionCache(
    userId: string,
    tenantId: string,
  ): Promise<void> {
    const pattern = `${IAM_CACHE_KEYS.PERMISSION_CACHE}${tenantId}:${userId}:*`;
    await this.redisService.scanDel(pattern);
    this.logger.debug(
      `Cleared permission cache for user ${userId} in tenant ${tenantId}`,
    );
  }

  /**
   * 清除角色权限缓存
   */
  private async clearRolePermissionCache(
    role: string,
    tenantId: string,
  ): Promise<void> {
    const rolePattern = `${IAM_CACHE_KEYS.ROLE_CACHE}${tenantId}:${role}`;
    await this.redisService.del(rolePattern);

    // 清除所有拥有该角色的用户的权限缓存
    const users = await this.getUsersForRole(role, tenantId);
    for (const userId of users) {
      await this.clearUserPermissionCache(userId, tenantId);
    }

    // 清除所有包含该角色的用户组的权限缓存
    const groups = await this.getGroupsForRole(role, tenantId);
    for (const groupId of groups) {
      await this.clearGroupPermissionCache(groupId, tenantId);
    }

    this.logger.debug(
      `Cleared permission cache for role ${role} in tenant ${tenantId}`,
    );
  }

  /**
   * 清除用户组权限缓存
   */
  private async clearGroupPermissionCache(
    groupId: string,
    tenantId: string,
  ): Promise<void> {
    const groupPattern = `${IAM_CACHE_KEYS.GROUP_CACHE}${tenantId}:${groupId}`;
    await this.redisService.del(groupPattern);

    // 清除该用户组所有用户的权限缓存
    const users = await this.getUsersForGroup(groupId, tenantId);
    for (const userId of users) {
      await this.clearUserPermissionCache(userId, tenantId);
    }

    this.logger.debug(
      `Cleared permission cache for group ${groupId} in tenant ${tenantId}`,
    );
  }

  /**
   * 清除所有权限缓存
   */
  private async clearAllPermissionCache(): Promise<void> {
    const patterns = [
      `${IAM_CACHE_KEYS.PERMISSION_CACHE}*`,
      `${IAM_CACHE_KEYS.ROLE_CACHE}*`,
      `${IAM_CACHE_KEYS.GROUP_CACHE}*`,
      `${IAM_CACHE_KEYS.USER_CACHE}*`,
    ];

    for (const pattern of patterns) {
      await this.redisService.scanDel(pattern);
    }

    this.logger.log('Cleared all permission caches');
  }

  /**
   * 用户组分配角色（修复：使用角色名称而不是ID）
   */
  async assignRolesToGroup(
    tenantId: number,
    groupId: number,
    roleNames: string[], // 修改为使用角色名称
  ): Promise<boolean> {
    const result = await this.enforcer.addGroupingPolicies(
      roleNames.map((roleName) => [
        groupId.toString(),
        roleName,
        tenantId.toString(),
      ]),
    );
    if (result) {
      await this.clearGroupPermissionCache(
        groupId.toString(),
        tenantId.toString(),
      );
    }
    return result;
  }

  /**
   * 用户组添加用户
   */
  async addUsersToGroup(
    tenantId: number,
    groupId: number,
    userIds: number[],
  ): Promise<boolean> {
    const result = await this.enforcer.addGroupingPolicies(
      userIds.map((id) => [
        id.toString(),
        groupId.toString(),
        tenantId.toString(),
      ]),
    );
    if (result) {
      // 清除相关用户的权限缓存
      for (const userId of userIds) {
        await this.clearUserPermissionCache(
          userId.toString(),
          tenantId.toString(),
        );
      }
    }
    return result;
  }

  /**
   * 从用户组移除用户
   */
  async removeUsersFromGroup(
    tenantId: number,
    groupId: number,
    userIds: number[],
  ): Promise<boolean> {
    const result = await this.enforcer.removeGroupingPolicies(
      userIds.map((id) => [
        id.toString(),
        groupId.toString(),
        tenantId.toString(),
      ]),
    );
    if (result) {
      // 清除相关用户的权限缓存
      for (const userId of userIds) {
        await this.clearUserPermissionCache(
          userId.toString(),
          tenantId.toString(),
        );
      }
    }
    return result;
  }

  /**
   * 从用户组移除角色
   */
  async removeRolesFromGroup(
    tenantId: number,
    groupId: number,
    roleNames: string[],
  ): Promise<boolean> {
    const result = await this.enforcer.removeGroupingPolicies(
      roleNames.map((roleName) => [
        groupId.toString(),
        roleName,
        tenantId.toString(),
      ]),
    );
    if (result) {
      await this.clearGroupPermissionCache(
        groupId.toString(),
        tenantId.toString(),
      );
    }
    return result;
  }

  /**
   * 获取用户组的所有角色
   */
  async getRolesForGroup(groupId: string, tenantId: string): Promise<string[]> {
    return this.enforcer.getRolesForUser(groupId, tenantId);
  }

  /**
   * 获取角色的所有用户组
   */
  async getGroupsForRole(role: string, tenantId: string): Promise<string[]> {
    return this.enforcer.getUsersForRole(role, tenantId);
  }

  /**
   * 获取用户组的所有用户
   */
  async getUsersForGroup(groupId: string, tenantId: string): Promise<string[]> {
    return this.enforcer.getUsersForRole(groupId, tenantId);
  }

  /**
   * 获取用户的所有用户组
   */
  async getGroupsForUser(userId: string, tenantId: string): Promise<string[]> {
    return this.enforcer.getRolesForUser(userId, tenantId);
  }

  /**
   * 删除用户组的所有关联
   */
  async deleteGroup(groupId: string): Promise<boolean> {
    const result = await this.enforcer.deleteUser(groupId);
    if (result) {
      // 清除用户组相关的所有缓存
      const pattern = `${IAM_CACHE_KEYS.GROUP_CACHE}*:${groupId}`;
      await this.redisService.scanDel(pattern);
    }
    return result;
  }
}
