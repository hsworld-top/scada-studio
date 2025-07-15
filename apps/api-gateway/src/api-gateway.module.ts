import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { I18nLibModule } from '@app/i18n-lib';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { AuthController } from './auth/auth.controller';
import { WebscoketMngGateway } from './webscoket-mng/webscoket-mng.gateway';
import { JwtStrategy } from './auth/jwt.strategy';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { CryptoUtil } from './common/utils/crypto.util';
import { ResponseUtil } from './common/utils/response.util';
import { ConfigModule } from '@nestjs/config';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    I18nLibModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: () => {
        const jwtSecret = process.env.JWT_SECRET;

        if (!jwtSecret) {
          throw new Error('JWT_SECRET environment variable is required');
        }

        // 在生产环境中验证密钥强度
        if (process.env.NODE_ENV === 'production') {
          if (jwtSecret === 'default-secret-key-for-dev') {
            throw new Error(
              'Production environment cannot use default JWT secret',
            );
          }
          if (jwtSecret.length < 32) {
            throw new Error(
              'JWT secret must be at least 32 characters in production',
            );
          }
        }

        return {
          secret: jwtSecret,
          signOptions: {
            expiresIn: process.env.JWT_ACCESS_TOKEN_TTL || '1h',
            issuer: 'scada-studio-api-gateway',
            audience: 'scada-studio-clients',
          },
        };
      },
    }),
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.AUTH_SERVICE_HOST || '127.0.0.1',
          port: Number(process.env.AUTH_SERVICE_PORT || 3002),
        },
      },
      {
        name: 'PROJECT_STUDIO_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.PROJECT_STUDIO_HOST || '127.0.0.1',
          port: Number(process.env.PROJECT_STUDIO_PORT || 3003),
        },
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [
    JwtStrategy,
    CryptoUtil,
    ResponseUtil,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    WebscoketMngGateway,
  ],
})
export class ApiGatewayModule {}
