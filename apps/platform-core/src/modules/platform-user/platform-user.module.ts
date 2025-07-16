import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformUser } from './platform-user.entity';
import { PlatformUserService } from './platform-user.service';
import { PlatformAdminController } from './platform-user.controller';
import { JwtModule } from '@nestjs/jwt';
import { AuditTenantLogModule } from '../audit/audit-tenant-log.module';
/**
 * 平台用户模块
 * 负责平台超级管理员相关的依赖注入、服务与控制器注册
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([PlatformUser]),
    JwtModule,
    AuditTenantLogModule,
  ],
  providers: [PlatformUserService],
  controllers: [PlatformAdminController],
  exports: [PlatformUserService],
})
export class PlatformUserModule {}
