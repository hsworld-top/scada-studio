import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis-lib.constants';
import { AppLogger } from '@app/logger-lib';

@Injectable()
export class RedisLibService implements OnModuleInit {
  private readonly context = 'RedisService';

  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
    private readonly logger: AppLogger,
  ) {}

  onModuleInit() {
    this.logger.setContext(this.context);
    this.redisClient.on('connect', () => {
      this.logger.log('Successfully connected to Redis.');
    });
    this.redisClient.on('error', (err) => {
      this.logger.error('Redis connection error:', err.stack);
    });
  }

  get(key: string): Promise<string | null> {
    return this.redisClient.get(key) as Promise<string | null>;
  }

  set(key: string, value: string, ttl?: number): Promise<'OK'> {
    if (ttl) {
      return this.redisClient.setex(key, ttl, value) as Promise<'OK'>;
    }
    return this.redisClient.set(key, value) as Promise<'OK'>;
  }

  del(keys: string | string[]): Promise<number> {
    const keysToDelete = Array.isArray(keys) ? keys : [keys];
    if (keysToDelete.length === 0) {
      return Promise.resolve(0);
    }
    return this.redisClient.del(keysToDelete) as Promise<number>;
  }

  hset(key: string, data: Record<string, any>): Promise<number> {
    const flattenedData = Object.entries(data).flatMap(([field, value]) => [
      field,
      typeof value === 'object' ? JSON.stringify(value) : String(value),
    ]);
    if (flattenedData.length === 0) {
      return Promise.resolve(0);
    }
    return this.redisClient.hset(key, ...flattenedData) as Promise<number>;
  }

  hgetall(key: string): Promise<Record<string, string>> {
    return this.redisClient.hgetall(key) as Promise<Record<string, string>>;
  }

  async scanDel(pattern: string): Promise<void | Error> {
    const stream = this.redisClient.scanStream({ match: pattern, count: 100 });
    return new Promise<void | Error>((resolve, reject) => {
      const keysToDelete: string[] = [];
      stream.on('data', (keys: string[]) => {
        if (keys.length) {
          keysToDelete.push(...keys);
        }
      });
      stream.on('end', async () => {
        try {
          if (keysToDelete.length > 0) {
            await this.del(keysToDelete);
          }
          resolve();
        } catch (err) {
          reject(err as Error);
        }
      });
      stream.on('error', (err) => {
        reject(err as Error);
      });
    });
  }

  get client(): Redis {
    return this.redisClient;
  }
}
