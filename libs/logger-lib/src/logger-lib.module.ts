import { DynamicModule, Global, Module } from '@nestjs/common';
import { AppLogger } from './logger-lib.service';

// 定义配置接口，使配置更类型安全
export interface LoggerLibConfig {
  service?: string;
  context?: string;
  level?: string;
  enableFile?: boolean;
  enableConsole?: boolean;
  logDir?: string;
  env?: 'development' | 'production' | 'test';
  zippedArchive?: boolean;
  maxSize?: string;
  maxFiles?: string;
}
@Global() // 将模块设为全局模块
@Module({})
export class LoggerLibModule {
  static forRoot(config: LoggerLibConfig): DynamicModule {
    return {
      module: LoggerLibModule,
      providers: [
        {
          provide: AppLogger, // 使用类本身作为注入令牌
          useValue: new AppLogger(config), // 使用传入的配置创建实例
        },
      ],
      exports: [AppLogger], // 导出服务，以便其他模块可以注入
    };
  }
}
