import { Module } from '@nestjs/common';

import { RoleController } from './role.controller';
import { RoleService } from './role.service';
import { CasbinModule } from '../casbin/casbin.module';
import { TenantModule } from '../tenant/tenant.module';
import { AuditLogModule } from '../audit/audit-log.module';

@Module({
  imports: [CasbinModule, TenantModule, AuditLogModule],
  controllers: [RoleController],
  providers: [RoleService],
  exports: [RoleService],
})
export class RoleModule {}
