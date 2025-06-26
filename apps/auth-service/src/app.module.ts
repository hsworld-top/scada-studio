import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { RedisLibModule } from '@app/redis-lib';
import { PgLibModule, PgLibService } from '@app/pg-lib';
import { LoggerLibModule } from '@app/logger-lib';
import { CasbinModule } from './modules/casbin/casbin.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { GroupModule } from './modules/group/group.module';
import { RoleModule } from './modules/role/role.module';
import { PermissionModule } from './modules/permission/permission.module';
import { SharedDatabaseModule } from './common/database/database.module'; // 导入共享数据库模块
import { I18nLibModule } from '@app/i18n-lib';
@Module({
  imports: [
    I18nLibModule,
    LoggerLibModule.forRoot({
      service: 'auth-service',
      env: (process.env.NODE_ENV as any) || 'development',
      logDir: 'logs',
      level: 'info',
    }),
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync({
      imports: [PgLibModule],
      useExisting: PgLibService,
      inject: [PgLibService],
    }),
    SharedDatabaseModule, //  使用共享数据库模块
    RedisLibModule.register(),

    // 业务模块
    TenantModule,
    GroupModule,
    UserModule,
    AuthModule,
    CasbinModule,
    RoleModule,
    PermissionModule,
  ],
})
export class AppModule {}
