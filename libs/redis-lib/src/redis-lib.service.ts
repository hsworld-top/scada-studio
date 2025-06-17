import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisLibService {
  // 重命名类
  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {}

  async get(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<'OK'> {
    if (ttl) {
      return this.redisClient.set(key, value, 'EX', ttl);
    }
    return this.redisClient.set(key, value);
  }

  async hset(key: string, data: Record<string, any>): Promise<number> {
    const flattenedData = Object.entries(data).flat();
    return this.redisClient.hset(key, ...flattenedData);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return this.redisClient.hgetall(key);
  }

  // ... 其他命令

  // 重命名 getter 以提高清晰度
  get client(): Redis {
    return this.redisClient;
  }
}
