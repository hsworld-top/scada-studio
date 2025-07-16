import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './platform-tenant.entity';
import { AuditTenantLogModule } from '../audit/audit-tenant-log.module';
import { TenantService } from './platform-tenant.service';
import { TenantController } from './platform-tenant.controller';
import { PlatformUser } from '../platform-user/platform-user.entity';
import { JwtModule } from '@nestjs/jwt';
/**
 * 租户模块
 * 负责租户相关的依赖注入、服务与控制器注册
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, PlatformUser]),
    JwtModule,
    AuditTenantLogModule,
  ],
  providers: [TenantService],
  controllers: [TenantController],
  exports: [TenantService],
})
export class TenantModule {}
