import { Injectable } from '@nestjs/common';
import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';

@Injectable()
export class ApiGatewayService {
  private readonly client: ClientProxy;

  constructor() {
    this.client = ClientProxyFactory.create({
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: 3002, // 用户服务的端口
      },
    });
  }
  getHello(): string {
    return 'Hello World!';
  }
  async createAdmin(createAdminDto: any): Promise<any> {
    return await this.client.send('create-admin', createAdminDto).toPromise();
  }
}
