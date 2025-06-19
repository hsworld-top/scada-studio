import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { AppLogger } from '@app/logger-lib';

async function startMicroservice() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: Number(process.env.AUTH_SERVICE_PORT || 3002),
      },
      bufferLogs: true,
    },
  );
  // 设置全局日志
  app.useLogger(app.get(AppLogger));
  await app.listen();
}

async function bootstrap() {
  // 创建一个临时的启动日志记录器
  const tmpLogger = new AppLogger({
    service: 'auth-service-bootstrap',
    env: (process.env.NODE_ENV as any) || 'development',
    logDir: 'logs',
    level: 'info',
  });
  try {
    // 启动微服务
    await startMicroservice();
    tmpLogger.log(
      `Auth service is running on port ${process.env.AUTH_SERVICE_PORT || 3002}`,
      'Bootstrap',
    );
  } catch (error) {
    tmpLogger.error('Application failed to start.', error.stack, 'Bootstrap');
    process.exit(1);
  }
}

bootstrap();
