import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { User } from './modules/user/entities/user.entity';
import { Role } from './modules/user/entities/role.entity';
import { Group } from './modules/user/entities/group.entity';
import { Tenant } from './modules/tenant/entities/tenant.entity';
import { RedisLibModule } from '@app/redis-lib';
import { PgLibModule, PgLibService } from '@app/pg-lib';
import { LoggerLibModule } from '@app/logger-lib';
import { CasbinModule } from './modules/casbin/casbin.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { GroupModule } from './modules/group/group.module';
import { RoleModule } from './modules/role/role.module';
import { PermissionModule } from './modules/permission/permission.module';

@Module({
  imports: [
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
    // 注册所有实体，以便在任何地方使用 Repository
    TypeOrmModule.forFeature([User, Role, Tenant, Group]),
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
