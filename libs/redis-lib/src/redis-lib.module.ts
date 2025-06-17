import { Module, DynamicModule, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisLibService } from './redis-lib.service'; // 使用重命名后的服务
import Redis from 'ioredis';

@Module({})
export class RedisLibModule {
  // 重命名类
  private static readonly logger = new Logger(RedisLibModule.name);

  static register(): DynamicModule {
    const redisClientProvider = {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService): Redis => {
        const client = new Redis({
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD'),
          db: configService.get<number>('REDIS_DB', 0),
        });

        client.on('connect', () => {
          this.logger.log('成功连接到 Redis。');
        });

        client.on('error', (err) => {
          this.logger.error('Redis 连接错误:', err);
        });

        return client;
      },
      inject: [ConfigService],
    };

    return {
      module: RedisLibModule, // 使用重命名后的类
      imports: [ConfigModule],
      providers: [redisClientProvider, RedisLibService], // 使用重命名后的服务
      exports: [RedisLibService], // 使用重命名后的服务
    };
  }
}
