import { Module } from '@nestjs/common';
import { PermissionController } from './permission.controller';
import { PermissionService } from './permission.service';
import { CasbinModule } from '../casbin/casbin.module';
import { AuditLogModule } from '../audit/audit-log.module';
@Module({
  imports: [CasbinModule, AuditLogModule],
  controllers: [PermissionController],
  providers: [PermissionService],
})
export class PermissionModule {}
