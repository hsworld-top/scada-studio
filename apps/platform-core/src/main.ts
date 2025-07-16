/**
 * 平台核心服务入口
 * 启动 NestJS 微服务，加载平台核心模块，配置 TCP 传输参数
 */

import { NestFactory } from '@nestjs/core';
import { PlatformCoreModule } from './platform-core.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppLogger } from '@app/logger-lib';

/**
 * 启动微服务实例
 * 配置 TCP 传输，端口从环境变量 PLATFORM_CORE_PORT 读取，默认 3001
 */
async function startMicroservice() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    PlatformCoreModule,
    {
      transport: Transport.TCP,
      options: {
        host: 'localhost',
        port: Number(process.env.PLATFORM_CORE_PORT || 3001),
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

// 启动平台核心服务
bootstrap();
