import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {}

  // 封装常用的 Redis 命令
  async get(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<'OK'> {
    if (ttl) {
      return this.redisClient.set(key, value, 'EX', ttl);
    }
    return this.redisClient.set(key, value);
  }

  // 使用 Hash 存储对象
  async hset(key: string, data: Record<string, any>): Promise<number> {
    const flattenedData = Object.entries(data).flat();
    return this.redisClient.hset(key, ...flattenedData);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return this.redisClient.hgetall(key);
  }

  // 使用 Set 管理关系
  async sadd(key: string, members: string[]): Promise<number> {
    return this.redisClient.sadd(key, ...members);
  }

  async smembers(key: string): Promise<string[]> {
    return this.redisClient.smembers(key);
  }

  // ... 其他你需要的命令，比如 del, incr, etc.

  // 提供原始客户端以备不时之需
  get aclient(): Redis {
    return this.redisClient;
  }
}
