import { Module, DynamicModule, Provider, Global } from '@nestjs/common';
import { RedisLibService } from './redis-lib.service';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis-lib.constants';
import { AppLogger } from '@app/logger-lib';
@Global() // 将 RedisLibModule 设为全局模块
@Module({})
export class RedisLibModule {
  static register(): DynamicModule {
    const redisClientProvider: Provider = {
      provide: REDIS_CLIENT,
      inject: [AppLogger],
      useFactory: (logger: AppLogger): Redis => {
        const client = new Redis({
          host: process.env.REDIS_HOST,
          port: Number(process.env.REDIS_PORT || 6379),
          password: process.env.REDIS_PASSWORD || undefined,
          db: Number(process.env.REDIS_DB || 0),
          retryStrategy: (times) => Math.min(times * 50, 2000),
        });
        client.on('connect', () => {
          logger.log(
            `Successfully connected to Redis at ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
            'RedisLibModule',
          );
        });
        client.on('error', (err) => {
          logger.error('Redis connection error:', err.stack, 'RedisLibModule');
        });
        return client;
      },
    };

    return {
      module: RedisLibModule,
      imports: [],
      providers: [redisClientProvider, RedisLibService],
      exports: [RedisLibService],
    };
  }
}
