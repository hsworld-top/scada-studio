import { NestFactory } from '@nestjs/core';
import { GatewayModule } from './gateway.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppLogger } from '@app/logger-lib'; // 引入自定义日志库

async function bootstrap() {
  const logger = new AppLogger({
    service: 'gateway',
    context: 'Bootstrap',
    env: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  });
  const app = await NestFactory.create<NestExpressApplication>(GatewayModule);
  app.useLogger(logger);
  await app.listen(process.env.GATEWAY_PORT ?? 3000, '0.0.0.0');
  logger.log(
    `API Gateway is running on port ${process.env.GATEWAY_PORT}`,
    'Bootstrap',
  );
}
bootstrap();
