import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { AuthController } from './auth/auth.controller';
import { WebscoketMngGateway } from './webscoket-mng/webscoket-mng.gateway';
import { JwtStrategy } from './auth/jwt.strategy';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { CryptoUtil } from './common/utils/crypto.util';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default-secret-key-for-dev',
      signOptions: { expiresIn: '1h' },
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
