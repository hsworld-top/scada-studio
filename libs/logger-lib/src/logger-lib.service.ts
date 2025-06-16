import { LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import 'winston-daily-rotate-file'; // 用于日志按天滚动
import * as fs from 'fs';

/**
 * 通用日志服务，兼容 NestJS LoggerService 接口。
 * 支持 console/file 输出、日志分级、自动压缩、按天归档等功能。
 */
export class AppLogger implements LoggerService {
  private readonly logger: winston.Logger;
  private context = 'App';

  constructor(config?: {
    service?: string; // 服务标识，用于标注来源
    context?: string; // 默认上下文名
    level?: string; // 最低日志等级：'info' | 'warn' | 'error' 等
    enableFile?: boolean; // 是否启用文件日志
    enableConsole?: boolean; // 是否启用控制台日志
    logDir?: string; // 文件日志目录
    env?: 'development' | 'production' | 'test'; // 环境
    zippedArchive?: boolean; // 是否压缩归档日志文件
    maxSize?: string; // 单个文件最大体积，如 "20m"
    maxFiles?: string; // 保留文件天数，如 "14d"
  }) {
    const {
      service = 'app',
      context = 'App',
      level = 'info',
      enableFile = true,
      enableConsole = true,
      logDir = 'logs',
      env = 'development',
      zippedArchive = true,
      maxSize = '20m',
      maxFiles = '14d',
    } = config || {};

    this.context = context;

    // 创建日志目录（如不存在）
    if (enableFile && !fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const transports: winston.transport[] = [];

    // 控制台输出（开发友好格式）
    if (enableConsole) {
      transports.push(
        new winston.transports.Console({
          format:
            env === 'development'
              ? winston.format.combine(
                  winston.format.colorize(),
                  winston.format.simple(),
                )
              : winston.format.json(),
        }),
      );
    }

    // 错误日志按天滚动
    if (enableFile) {
      transports.push(
        new winston.transports.DailyRotateFile({
          dirname: logDir,
          filename: `${service}.error-%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          zippedArchive,
          maxSize,
          maxFiles,
          format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.metadata({
              fillExcept: ['message', 'level', 'timestamp', 'context'],
            }),
            winston.format.json(),
          ),
          level: 'error',
        }),
      );

      // 其他日志按天滚动
      transports.push(
        new winston.transports.DailyRotateFile({
          dirname: logDir,
          filename: `${service}.combined-%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          zippedArchive,
          maxSize,
          maxFiles,
          format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.json(),
          ),
          level,
        }),
      );
    }

    // 创建 winston 实例
    this.logger = winston.createLogger({
      level,
      defaultMeta: { service },
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      transports,
    });
  }

  /**
   * 设置当前日志上下文
   * @param context 类名或模块名
   */
  setContext(context: string) {
    this.context = context;
  }

  /**
   * 记录 info 日志
   */
  log(message: any, context?: string) {
    this.logger.info(message, { context: context || this.context });
  }

  /**
   * 记录 error 日志，可附带堆栈信息
   */
  error(message: any, trace?: string, context?: string) {
    this.logger.error(message, {
      context: context || this.context,
      stack: trace,
    });
  }

  /**
   * 记录 warn 日志
   */
  warn(message: any, context?: string) {
    this.logger.warn(message, { context: context || this.context });
  }

  /**
   * 记录 debug 日志
   */
  debug(message: any, context?: string) {
    this.logger.debug(message, { context: context || this.context });
  }

  /**
   * 记录 verbose 日志
   */
  verbose(message: any, context?: string) {
    this.logger.verbose(message, { context: context || this.context });
  }
}
