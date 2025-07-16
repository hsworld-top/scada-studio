import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { I18nLibModule } from '@app/i18n-lib';
import { LoggerLibModule } from '@app/logger-lib';
import { PgLibModule, PgLibService } from '@app/pg-lib';
import { TenantModule } from './modules/platform-tenant/platform-tenant.module';
import { PlatformUserModule } from './modules/platform-user/platform-user.module';
import { PlatformAuthModule } from './modules/platform-auth/platform-auth.module';
import { JwtModule } from '@nestjs/jwt';
import { PlatformSessionGuard } from './guards/platform-session.guard';
import { SharedDatabaseModule } from './modules/database/database.module';
import { GlobalExceptionFilter } from './modules/common/global-exception.filter';
/**
 * 平台核心模块
 * 负责平台服务的主入口，聚合各功能模块并进行全局配置
 */
@Module({
  imports: [
    // 全局配置模块，加载 .env 环境变量
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    // 国际化模块
    I18nLibModule,
    // 日志模块，按环境区分日志级别
    LoggerLibModule.forRoot({
      service: 'platform-core',
      env: (process.env.NODE_ENV as any) || 'development',
      logDir: 'logs',
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
    }),
    // 数据库连接模块，异步配置
    TypeOrmModule.forRootAsync({
      imports: [PgLibModule],
      useExisting: PgLibService,
      inject: [PgLibService],
    }),
    // 共享数据库模块
    SharedDatabaseModule,
    // 租户模块
    TenantModule,
    // 平台用户模块
    PlatformUserModule,
    // 平台认证模块
    PlatformAuthModule,
    // JWT 配置
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET || 'default-secret-key-for-dev',
        signOptions: { expiresIn: '60m' },
      }),
    }),
  ],
  controllers: [],
  providers: [PlatformSessionGuard, GlobalExceptionFilter],
})
export class PlatformCoreModule {}
