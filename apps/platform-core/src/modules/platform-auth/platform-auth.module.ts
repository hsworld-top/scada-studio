import { Module } from '@nestjs/common';
import { PlatformAuthService } from './platform-auth.service';
import { AuditTenantLogModule } from '../audit/audit-tenant-log.module';
import { PlatformAuthController } from './platform-auth.controller';
@Module({
  imports: [AuditTenantLogModule],
  providers: [PlatformAuthService],
  exports: [PlatformAuthService],
  controllers: [PlatformAuthController],
})
export class PlatformAuthModule {}
