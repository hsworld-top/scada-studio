import { Injectable, Inject, OnModuleInit, forwardRef } from '@nestjs/common';
import { Enforcer, newEnforcer } from 'casbin';
import { RedisLibService } from '@app/redis-lib';
import { AppLogger } from '@app/logger-lib';
import { ConfigService } from '@nestjs/config';
import TypeORMAdapter from 'typeorm-adapter';
import { TypeORMAdapterOptions } from 'typeorm-adapter';
import * as path from 'path';

@Injectable()
export class CasbinService implements OnModuleInit {
  private readonly context = CasbinService.name;
  private enforcer: Enforcer;

  constructor(
    @Inject(forwardRef(() => RedisLibService))
    private readonly redisService: RedisLibService,
    private readonly logger: AppLogger,
    private readonly configService: ConfigService,
  ) {
    this.logger.setContext(this.context);
  }

  async onModuleInit() {
    const dbOptions: TypeORMAdapterOptions = {
      type: 'postgres',
      host: this.configService.get<string>('DB_HOST', 'localhost'),
      port: this.configService.get<number>('DB_PORT', 5432),
      username: this.configService.get<string>('DB_USER', 'postgres'),
      password: this.configService.get<string>('DB_PASSWORD', 'postgres'),
      database: this.configService.get<string>('DB_NAME', 'elite'),
    };

    // 在 monorepo 结构中，`process.cwd()` 通常指向项目根目录，是定位配置文件的可靠方式
    const modelPath = path.join(
      process.cwd(),
      '/apps/auth-service/src/casbin-model.conf',
    );
    const adapter = await TypeORMAdapter.newAdapter(dbOptions);
    this.enforcer = await newEnforcer(modelPath, adapter);

    await this.enforcer.loadPolicy();
    this.logger.log('Casbin enforcer has been initialized.');
  }

  /**
   * 获取 Casbin enforcer 实例。
   * @returns {Enforcer} enforcer 实例
   */
  getEnforcer(): Enforcer {
    return this.enforcer;
  }

  /**
   * 检查用户在特定租户下是否具有权限（多租户版）。
   * @param userId 用户ID
   * @param tenantId 租户ID
   * @param resource 资源
   * @param action 动作
   * @returns {Promise<boolean>} 是否有权限
   */
  async checkPermission(
    userId: string,
    tenantId: string,
    resource: string,
    action: string,
  ): Promise<boolean> {
    const cacheKey = `permission:${tenantId}:${userId}:${resource}:${action}`;
    const cachedResult = await this.redisService.get(cacheKey);
    if (cachedResult) {
      return cachedResult === 'true';
    }

    const hasPermission = await this.enforcer.enforce(
      userId,
      tenantId,
      resource,
      action,
    );
    await this.redisService.set(cacheKey, String(hasPermission), 3600); // 缓存1小时
    return hasPermission;
  }

  /**
   * 为用户在特定租户下添加角色（多租户版）。
   * @param userId 用户ID
   * @param role 角色名
   * @param tenantId 租户ID
   * @returns {Promise<boolean>} 操作是否成功
   */
  async addRoleForUser(
    userId: string,
    role: string,
    tenantId: string,
  ): Promise<boolean> {
    // Casbin 中的 g(user, role, domain) -> g(userId, role, tenantId)
    const result = await this.enforcer.addRoleForUser(userId, role, tenantId);
    if (result) {
      // 如果角色分配成功，清除该用户在该租户下的权限缓存
      await this.clearPermissionCacheForUser(userId, tenantId);
    }
    return result;
  }

  /**
   * 清除用户在特定租户下的所有权限缓存（多租户版）。
   * @param userId 用户ID
   * @param tenantId 租户ID
   */
  async clearPermissionCacheForUser(
    userId: string,
    tenantId: string,
  ): Promise<void> {
    const pattern = `permission:${tenantId}:${userId}:*`;
    this.logger.log(
      `Clearing permission cache for user ${userId} in tenant ${tenantId} with pattern: ${pattern}`,
    );
    await this.redisService.scanDel(pattern);
  }
}
