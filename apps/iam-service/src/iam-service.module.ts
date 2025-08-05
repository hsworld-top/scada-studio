import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { LoggerLibModule } from '@app/logger-lib';
import { PgLibModule, PgLibService } from '@app/pg-lib';
import { RedisLibModule } from '@app/redis-lib';
import { CasbinModule } from './modules/casbin/casbin.module';

// 导入共享数据库模块
import { SharedDatabaseModule } from './modules/database/database.module';

// 导入业务模块
import { UserModule } from './modules/user/user.module';
import { GroupModule } from './modules/group/group.module';
import { RoleModule } from './modules/role/role.module';
import { AuthModule } from './modules/auth/auth.module';
import { PermissionModule } from './modules/permission/permission.module';
import { TenantModule } from './modules/tenant/tenant.module';

// 导入全局异常过滤器
import { GlobalExceptionFilter } from './common/global-exception.filter';

@Module({
  imports: [
    // 基础配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    LoggerLibModule.forRoot({
      service: 'iam-service',
      env: (process.env.NODE_ENV as any) || 'development',
      logDir: 'logs/iam-service',
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
    }),

    // 数据库配置
    TypeOrmModule.forRootAsync({
      imports: [PgLibModule],
      useExisting: PgLibService,
      inject: [PgLibService],
    }),

    SharedDatabaseModule,
    RedisLibModule.register(),

    // 权限控制模块
    CasbinModule,
    // 业务功能模块
    UserModule,
    GroupModule,
    RoleModule,
    AuthModule,
    PermissionModule,
    TenantModule,
  ],

  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class IamServiceModule {}
