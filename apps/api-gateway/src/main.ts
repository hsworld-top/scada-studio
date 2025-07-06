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

  // 连接到 auth-service 微服务
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: process.env.AUTH_SERVICE_HOST || '127.0.0.1',
      port: Number(process.env.AUTH_SERVICE_PORT || 3002),
    },
  });

  // 连接到 project-studio 微服务
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: process.env.PROJECT_STUDIO_HOST || '127.0.0.1',
      port: Number(process.env.PROJECT_STUDIO_PORT || 3003),
    },
  });

  await app.startAllMicroservices(); // 启动所有微服务连接

  // 启动 HTTP 网关服务
  const port = Number(process.env.API_GATEWAY_PORT || 3000);
  await app.listen(port);

  logger.log(`API Gateway is running on port ${port}`, 'Bootstrap');
}
bootstrap();
