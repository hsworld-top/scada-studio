import { Module, DynamicModule, Provider, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisLibService } from './redis-lib.service';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis-lib.constants';
@Global() // 将 RedisLibModule 设为全局模块
@Module({})
export class RedisLibModule {
  static register(): DynamicModule {
    const redisClientProvider: Provider = {
      provide: REDIS_CLIENT,
      // 不再注入 AppLogger，移除对它的依赖
      inject: [ConfigService],
      // useFactory 只接收 ConfigService
      useFactory: (configService: ConfigService): Redis => {
        const client = new Redis({
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD'),
          db: configService.get<number>('REDIS_DB', 0),
          retryStrategy: (times) => Math.min(times * 50, 2000),
        });
        return client;
      },
    };

    return {
      module: RedisLibModule,
      // 只需要 ConfigModule
      imports: [ConfigModule],
      providers: [redisClientProvider, RedisLibService],
      exports: [RedisLibService],
    };
  }
}
