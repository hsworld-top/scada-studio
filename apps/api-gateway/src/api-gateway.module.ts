import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthGuard } from './auth/auth.guard';
import { ProxyModule } from './proxy/proxy.module';
import { WebscoketMngGateway } from './webscoket-mng/webscoket-mng.gateway';

@Module({
  imports: [
    ProxyModule,
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
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    WebscoketMngGateway,
  ],
})
export class ApiGatewayModule {}
