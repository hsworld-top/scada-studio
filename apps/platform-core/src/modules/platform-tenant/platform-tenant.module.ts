import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuditTenantLogModule } from '../audit/audit-tenant-log.module';
import { TenantService } from './platform-tenant.service';
import { TenantController } from './platform-tenant.controller';

/**
 * 租户模块
 * 负责租户相关的依赖注入、服务与控制器注册
 */
@Module({
  imports: [
    AuditTenantLogModule,
    ClientsModule.register([
      {
        name: 'IAM_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.IAM_SERVICE_HOST || 'localhost',
          port: Number(process.env.IAM_SERVICE_PORT) || 3002,
        },
      },
    ]),
  ],
  providers: [TenantService],
  controllers: [TenantController],
  exports: [TenantService],
})
export class TenantModule {}
