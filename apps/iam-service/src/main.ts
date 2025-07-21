/**
 * 平台用户角色鉴权服务入口
 * 启动 NestJS 微服务，加载平台核心模块，配置 TCP 传输参数
 */

import { NestFactory } from '@nestjs/core';
import { IamServiceModule } from './iam-service.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppLogger } from '@app/logger-lib';

/**
 * 启动微服务实例
 * 配置 TCP 传输，端口从环境变量 AUTH_SERVICE_PORT 读取，默认 3002
 */
async function startMicroservice() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    IamServiceModule,
    {
      transport: Transport.TCP,
      options: {
        host: 'localhost',
        port: Number(process.env.AUTH_SERVICE_PORT || 3002),
      },
      bufferLogs: true,
    },
  );
  // 设置自定义日志服务
  app.useLogger(app.get(AppLogger));
  await app.listen();
}

/**
 * 应用启动入口
 * 调用微服务启动函数
 */
async function bootstrap() {
  // 启动微服务
  await startMicroservice();
}

// 启动应用
bootstrap();
