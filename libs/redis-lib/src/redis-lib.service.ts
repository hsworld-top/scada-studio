import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis-lib.constants';
import { AppLogger } from '@app/logger-lib';

@Injectable()
export class RedisLibService {
  private readonly context = 'RedisService';

  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
    private readonly logger: AppLogger,
  ) {}

  get(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }

  set(key: string, value: string, ttl?: number): Promise<'OK'> {
    if (ttl) {
      return this.redisClient.setex(key, ttl, value);
    }
    return this.redisClient.set(key, value);
  }

  del(keys: string | string[]): Promise<number> {
    const keysToDelete = Array.isArray(keys) ? keys : [keys];
    if (keysToDelete.length === 0) {
      return Promise.resolve(0);
    }
    return this.redisClient.del(keysToDelete);
  }

  hset(key: string, data: Record<string, any>): Promise<number> {
    const flattenedData = Object.entries(data).flatMap(([field, value]) => [
      field,
      typeof value === 'object' ? JSON.stringify(value) : String(value),
    ]);
    if (flattenedData.length === 0) {
      return Promise.resolve(0);
    }
    return this.redisClient.hset(key, ...flattenedData);
  }

  hgetall(key: string): Promise<Record<string, string>> {
    return this.redisClient.hgetall(key);
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
      stream.on('end', () => {
        try {
          if (keysToDelete.length > 0) {
            this.del(keysToDelete)
              .then(() => {
                this.logger.log(
                  `Deleted ${keysToDelete.length} keys matching pattern: ${pattern}`,
                );
              })
              .catch((err) => {
                this.logger.error(`Error deleting keys: ${err.message}`);
                reject(err as Error);
              });
          }
          resolve();
        } catch (err) {
          reject(err as Error);
        }
      });
      stream.on('error', (err) => {
        reject(err);
      });
    });
  }

  get client(): Redis {
    return this.redisClient;
  }
}
