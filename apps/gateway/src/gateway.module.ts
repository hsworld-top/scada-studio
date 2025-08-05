import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { I18nLibModule } from '@app/i18n-lib';
import { LoggerLibModule } from '@app/logger-lib';
import { JwtModule } from '@nestjs/jwt';
import { TenantController } from './tenant/tenant.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { GlobalExceptionFilter } from './common/global-exception.filter';
import { I18nService } from 'nestjs-i18n';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    I18nLibModule,
    LoggerLibModule.forRoot({
      service: 'gateway',
      env: process.env.NODE_ENV === 'production' ? 'production' : 'development',
      logDir: 'logs/gateway',
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
    }),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: '60m' },
      }),
    }),
    ClientsModule.register([
      {
        name: 'PLATFORM_CORE_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.PLATFORM_CORE_HOST || 'localhost',
          port: Number(process.env.PLATFORM_CORE_PORT) || 3001,
        },
      },
    ]),
    ClientsModule.register([
      {
        name: 'IAM_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.IAM_SERVICE_HOST || 'localhost',
          port: Number(process.env.IAM_SERVICE_PORT) || 3002,
        },
      },
    ]),
  ],
  controllers: [TenantController],
  providers: [
    {
      provide: APP_FILTER,
      useFactory: (i18n: I18nService) => {
        return new GlobalExceptionFilter(i18n);
      },
      inject: [I18nService],
    },
  ],
})
export class GatewayModule {}
