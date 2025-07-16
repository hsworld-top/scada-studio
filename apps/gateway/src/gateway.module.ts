import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { I18nLibModule } from '@app/i18n-lib';
import { LoggerLibModule } from '@app/logger-lib';
import { JwtModule } from '@nestjs/jwt';
import { TenantController } from './tenant/tenant.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    I18nLibModule,
    LoggerLibModule.forRoot({
      service: 'gateway',
      env: process.env.NODE_ENV === 'production' ? 'production' : 'development',
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
  ],
  controllers: [TenantController],
  providers: [],
})
export class GatewayModule {}
