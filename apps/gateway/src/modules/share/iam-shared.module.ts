import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
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
  exports: [ClientsModule],
})
export class IamSharedModule {}
