import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { RedisLibModule } from '@app/redis-lib';
import { I18nLibModule } from '@app/i18n-lib';
import { AuditModule } from '../audit/audit.module';
import { TenantIntegrationService } from '../tenant/tenant-integration.service';

/**
 * 认证模块
 * 负责租户用户的认证相关功能，包括登录、登出、token管理等
 * 与platform-core的租户和平台用户管理进行集成
 */
@Module({
  imports: [
    UserModule,
    RedisLibModule,
    I18nLibModule,
    AuditModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET || 'default-secret-key-for-dev',
        signOptions: { expiresIn: '60m' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, TenantIntegrationService],
  exports: [AuthService],
})
export class AuthModule {}
