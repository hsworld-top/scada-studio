import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ApiGatewayModule } from './api-gateway.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppLogger } from '@app/logger-lib'; // 引入自定义日志库
async function bootstrap() {
  const logger = new AppLogger({
    service: 'api-gateway',
    context: 'Bootstrap',
    env: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  });
  const app = await NestFactory.create<NestExpressApplication>(
    ApiGatewayModule,
    { logger },
  );
  // 启动微服务客户端，用于与后端服务通信
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '127.0.0.1',
      port: 3001, // 本服务作为“客户端”监听的端口（与其他微服务建立连接）
    },
  });
  await app.startAllMicroservices(); // 启动所有 connectMicroservice 实例
  // 启动 HTTP 接口（例如供前端访问）
  await app.listen(3000);
}
bootstrap();
