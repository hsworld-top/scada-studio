import { DynamicModule, Module } from '@nestjs/common';
import * as winston from 'winston';
import { WinstonModule, utilities } from 'nest-winston';
import * as fs from 'fs';
import 'winston-daily-rotate-file';
import 'winston-daily-rotate-file';

// 定义模块配置接口
interface LoggerLibOptions {
  serviceName: string;
  logPath?: string; // 可选的日志文件路径
  logLevel?: string; // 添加日志级别配置
  maxSize?: number;
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
      maxSize = 20 * 1024 * 1024,
      maxFiles = 14,
      zippedArchive = true,
      enableConsole = true,
      enableFile = true,
    } = options;

    const transports: winston.transport[] = [];
    console.log(options, logLevel, maxFiles, enableConsole, enableFile);
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
        new winston.transports.DailyRotateFile({
          dirname: logPath,
          filename: `${serviceName}-%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          zippedArchive,
          maxSize,
          maxFiles,
          format: winston.format.combine(
            winston.format.timestamp({
              format: 'YYYY-MM-DD HH:mm:ss',
            }),
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
        new winston.transports.DailyRotateFile({
          dirname: logPath,
          filename: `${serviceName}-error-%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          zippedArchive,
          maxSize,
          maxFiles,
          format: winston.format.combine(
            winston.format.timestamp({
              format: 'YYYY-MM-DD HH:mm:ss',
            }),
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
