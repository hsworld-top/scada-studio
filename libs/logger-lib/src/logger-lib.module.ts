import { DynamicModule, Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { utilities } from 'nest-winston';
import * as fs from 'fs';

// 定义模块配置接口
interface LoggerLibOptions {
  serviceName: string;
  logPath?: string; // 可选的日志文件路径
  logLevel?: string; // 添加日志级别配置
  maxsize?: number;
  maxFiles?: number;
  zippedArchive?: boolean;
  enableConsole?: boolean; // 新增：是否启用控制台输出
  enableFile?: boolean; // 新增：是否启用文件输出
}

@Module({})
export class LoggerLibModule {
  static forRoot(options: LoggerLibOptions): DynamicModule {
    const {
      serviceName,
      logPath = 'logs',
      logLevel = 'info',
      maxsize = 20 * 1024 * 1024,
      maxFiles = 14,
      zippedArchive = true,
      enableConsole = true,
      enableFile = true,
    } = options;

    const transports: winston.transport[] = [];

    // 控制台输出
    if (enableConsole) {
      transports.push(
        new winston.transports.Console({
          level: logLevel,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            utilities.format.nestLike(),
          ),
        }),
      );
    }

    // 文件输出
    if (enableFile) {
      // 确保日志目录存在
      if (!fs.existsSync(logPath)) {
        fs.mkdirSync(logPath, { recursive: true });
      }

      // 普通日志文件
      transports.push(
        new winston.transports.File({
          filename: `${logPath}/${serviceName}-%DATE%.log`,
          zippedArchive,
          maxsize,
          maxFiles,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.metadata({
              fillExcept: ['message', 'level', 'timestamp', 'context'],
            }),
            winston.format.json(),
          ),
          level: logLevel,
        }),
      );

      // 错误日志文件
      transports.push(
        new winston.transports.File({
          filename: `${logPath}/${serviceName}-error-%DATE%.log`,
          zippedArchive,
          maxsize,
          maxFiles,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.metadata({
              fillExcept: ['message', 'level', 'timestamp', 'context'],
            }),
            winston.format.json(),
          ),
          level: 'error',
        }),
      );
    }

    return {
      module: LoggerLibModule,
      imports: [
        WinstonModule.forRoot({
          transports,
          exitOnError: false, // 添加错误处理
        }),
      ],
      exports: [WinstonModule],
    };
  }
}
