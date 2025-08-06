import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { I18nLibModule } from '@app/i18n-lib';
import { LoggerLibModule } from '@app/logger-lib';
import { JwtModule } from '@nestjs/jwt';
import { GlobalExceptionFilter } from './common/global-exception.filter';
import { I18nService } from 'nestjs-i18n';
import { IamModule } from './modules/iam/iam.module';
import { TenantModule } from './modules/tenant/tenant.module';
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
      global: true,
    }),
    IamModule,
    TenantModule,
  ],
  controllers: [],
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
