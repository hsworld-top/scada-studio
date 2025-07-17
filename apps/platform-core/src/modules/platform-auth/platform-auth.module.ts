import { Module } from '@nestjs/common';
import { PlatformAuthService } from './platform-auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformUser } from '../platform-user/platform-user.entity';
import { AuditTenantLogModule } from '../audit/audit-tenant-log.module';
import { PlatformAuthController } from './platform-auth.controller';
@Module({
  imports: [TypeOrmModule.forFeature([PlatformUser]), AuditTenantLogModule],
  providers: [PlatformAuthService],
  exports: [PlatformAuthService],
  controllers: [PlatformAuthController],
})
export class PlatformAuthModule {}
