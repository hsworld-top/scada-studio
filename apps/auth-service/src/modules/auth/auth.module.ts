import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { RedisLibModule } from '@app/redis-lib';
import { TenantModule } from '../tenant/tenant.module';
import { AuditLogModule } from '../audit/audit-log.module';
/**
 * AuthModule 负责认证相关模块的依赖注入与配置。
 */
@Module({
  imports: [
    UserModule,
    RedisLibModule,
    TenantModule,
    AuditLogModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET || 'default-secret-key-for-dev',
        signOptions: { expiresIn: '60m' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
