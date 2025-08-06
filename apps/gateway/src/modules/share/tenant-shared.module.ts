import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
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
  exports: [ClientsModule],
})
export class TenantSharedModule {}
