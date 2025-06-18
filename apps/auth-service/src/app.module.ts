import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { User } from './modules/user/entities/user.entity';
import { Role } from './modules/user/entities/role.entity';
import { RedisLibModule } from '@app/redis-lib';
import { PgLibModule, PgLibService } from '@app/pg-lib';
import { LoggerLibModule } from '@app/logger-lib';

/**
 * AppModule 是应用的主模块，负责全局配置和核心模块的导入。
 *
 * - imports: 依次引入日志、配置、数据库、Redis、Casbin、用户、认证等模块。
 *   - LoggerLibModule: 日志模块，需最先配置。
 *   - ConfigModule: 全局配置模块，加载 .env 环境变量。
 *   - TypeOrmModule: 数据库 ORM 配置，支持异步和实体注册。
 *   - RedisLibModule: Redis 支持。
 *   - CasbinModule: 权限控制。
 *   - UserModule/AuthModule: 用户与认证。
 */
@Module({
  imports: [
    // 2. 在所有模块之前首先配置日志模块
    LoggerLibModule.forRoot({
      service: 'auth-service', // 服务名
      env: (process.env.NODE_ENV as any) || 'development',
      logDir: 'logs',
      level: 'info',
    }),
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }), // 全局配置
    TypeOrmModule.forRootAsync({
      imports: [PgLibModule],
      useExisting: PgLibService,
      inject: [PgLibService],
    }),
    TypeOrmModule.forFeature([User, Role]), // 注册实体
    RedisLibModule.register(), // Redis 支持
    UserModule, // 用户模块
    AuthModule, // 认证模块
  ],
})
export class AppModule {}
