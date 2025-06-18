import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { RedisLibModule } from '@app/redis-lib';

/**
 * AuthModule 负责认证相关模块的依赖注入与配置。
 *
 * - imports: 引入用户模块、Passport、Redis、JWT 相关模块。
 * - controllers: 注册认证控制器。
 * - providers: 注册认证服务和 JWT 策略。
 */
@Module({
  imports: [
    UserModule, // 用户模块，提供用户相关服务
    PassportModule, // Passport 认证模块
    RedisLibModule, // Redis 模块，用于 token 黑名单等
    JwtModule.registerAsync({
      imports: [ConfigModule], // 引入配置模块
      inject: [ConfigService], // 注入配置服务
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET', 'default-secret-key-for-dev'), // JWT 密钥
        signOptions: { expiresIn: '60m' }, // token 过期时间
      }),
    }),
  ],
  controllers: [AuthController], // 认证控制器
  providers: [AuthService, JwtStrategy], // 认证服务和 JWT 策略
  exports: [AuthService],
})
export class AuthModule {}
