import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { AppLogger } from '@app/logger-lib';

async function bootstrap() {
  // 创建自定义日志实例
  const logger = new AppLogger({
    service: 'auth-service',
    context: 'Bootstrap',
    env: (process.env.NODE_ENV as any) || 'development',
  });
  try {
    const app = await NestFactory.createMicroservice<MicroserviceOptions>(
      AppModule,
      {
        transport: Transport.TCP,
        options: {
          host: '0.0.0.0',
          port: Number(process.env.AUTH_SERVICE_PORT) || 3002,
        },
        logger, // 替换为自定义日志实例
      },
    );
    await app.listen();
    logger.log(
      `Auth microservice is listening on port ${process.env.AUTH_SERVICE_PORT}`,
    );
  } catch (error) {
    logger.error('Application failed to start.', error.stack);
    process.exit(1);
  }
}

bootstrap();
