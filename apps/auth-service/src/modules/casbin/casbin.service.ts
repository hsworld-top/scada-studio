import { Injectable, Inject, OnModuleInit, forwardRef } from '@nestjs/common';
import { Enforcer, newEnforcer } from 'casbin';
import { RedisLibService } from '@app/redis-lib';
import { AppLogger } from '@app/logger-lib';
import { ConfigService } from '@nestjs/config'; // 导入 ConfigService
import TypeORMAdapter from 'typeorm-adapter';
import { TypeORMAdapterOptions } from 'typeorm-adapter';
import * as path from 'path';

@Injectable()
export class CasbinService implements OnModuleInit {
  private readonly context = CasbinService.name;
  private enforcer: Enforcer; // enforcer 现在是类的私有属性

  constructor(
    @Inject(forwardRef(() => RedisLibService))
    private readonly redisService: RedisLibService,
    private readonly logger: AppLogger,
    private readonly configService: ConfigService, // 直接注入 ConfigService
  ) {
    this.logger.setContext(this.context);
  }

  // 在 onModuleInit 中手动执行所有初始化逻辑
  async onModuleInit() {
    const dbOptions: TypeORMAdapterOptions = {
      type: 'postgres',
      host: this.configService.get<string>('DB_HOST'),
      port: this.configService.get<number>('DB_PORT'),
      username: this.configService.get<string>('DB_USER'),
      password: this.configService.get<string>('DB_PASSWORD'),
      database: this.configService.get<string>('DB_NAME'),
    };

    const adapter = await TypeORMAdapter.newAdapter(dbOptions);
    this.enforcer = await newEnforcer(
      path.join(__dirname, '../../casbin-model.conf'),
      adapter,
    );

    await this.enforcer.loadPolicy();
    this.logger.log('Casbin enforcer has been initialized.');

    await this.seed();
  }

  // 其他方法现在使用 this.enforcer
  async checkPermission(
    userId: string,
    resource: string,
    action: string,
  ): Promise<boolean> {
    const cacheKey = `permission:${userId}:${resource}:${action}`;
    const cachedResult = await this.redisService.get(cacheKey);
    if (cachedResult) {
      return cachedResult === 'true';
    }
    // 使用 this.enforcer
    const hasPermission = await this.enforcer.enforce(userId, resource, action);
    await this.redisService.set(cacheKey, String(hasPermission), 3600);
    return hasPermission;
  }

  async addRoleForUser(userId: string, role: string): Promise<boolean> {
    // 使用 this.enforcer
    const result = await this.enforcer.addGroupingPolicy(userId, role);
    if (result) {
      await this.clearPermissionCacheForUser(userId);
    }
    return result;
  }

  async clearPermissionCacheForUser(userId: string): Promise<void> {
    const pattern = `permission:${userId}:*`;
    this.logger.log(
      `Clearing permission cache for user ${userId} with pattern: ${pattern}`,
    );
    await this.redisService.scanDel(pattern);
  }

  private async seed() {
    // 使用 this.enforcer
    const policies = await this.enforcer.getPolicy();
    if (policies.length === 0) {
      this.logger.log('Database is empty. Seeding initial Casbin policies...');
      const initialPolicies = [
        ['super-admin', 'all', 'manage'],
        ['developer', 'workbench', 'access'],
        ['developer', 'project', 'manage'],
        ['super-admin', 'user', 'create'],
      ];
      await this.enforcer.addPolicies(initialPolicies);
      this.logger.log('Initial policies have been seeded successfully.');
    }
  }
}
