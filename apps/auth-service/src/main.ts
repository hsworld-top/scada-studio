import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AuthServiceModule } from './auth-service.module';
import { AppLogger } from '@app/logger-lib';

async function bootstrap() {
  const logger = new AppLogger({
    service: 'auth-service',
    context: 'Bootstrap',
    env: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  });
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AuthServiceModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: 3002,
      },
      logger, // 替换为自定义日志实例
    },
  );
  await app.listen();
}
bootstrap();
