import { Module } from '@nestjs/common';
import { PlatformAuthService } from './platform-auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformUser } from '../platform-user/platform-user.entity';
import { JwtModule } from '@nestjs/jwt';
import { AuditTenantLogModule } from '../audit/audit-tenant-log.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([PlatformUser]),
    JwtModule,
    AuditTenantLogModule,
  ],
  providers: [PlatformAuthService],
  exports: [PlatformAuthService],
})
export class PlatformAuthModule {}
