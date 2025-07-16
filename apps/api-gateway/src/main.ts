import { NestFactory } from '@nestjs/core';
import { ApiGatewayModule } from './api-gateway.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppLogger } from '@app/logger-lib'; // 引入自定义日志库

async function bootstrap() {
  const logger = new AppLogger({
    service: 'api-gateway',
    context: 'Bootstrap',
    env: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  });

  // 验证必要的环境变量
  const requiredEnvVars = ['JWT_SECRET'];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      logger.error(`缺少必要的环境变量: ${envVar}`);
      process.exit(1);
    }
  }

  const app = await NestFactory.create<NestExpressApplication>(
    ApiGatewayModule,
    { logger },
  );

  // 启动 HTTP 网关服务
  const port = Number(process.env.API_GATEWAY_PORT || 3000);
  await app.listen(port, '0.0.0.0');

  logger.log(`API Gateway is running on port ${port}`, 'Bootstrap');
}

bootstrap().catch((error) => {
  console.error('Failed to start API Gateway:', error);
  process.exit(1);
});
