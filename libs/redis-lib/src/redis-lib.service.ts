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

  /**
   * 获取
   * @param key 键
   * @returns 值
   */
  get(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }
  /**
   * 设置
   * @param key 键
   * @param value 值
   * @param ttl 过期时间
   * @returns 是否成功
   */
  set(key: string, value: string, ttl?: number): Promise<'OK'> {
    if (ttl) {
      return this.redisClient.setex(key, ttl, value);
    }
    return this.redisClient.set(key, value);
  }
  /**
   * 删除
   * @param keys 键
   * @returns 是否成功
   */
  del(keys: string | string[]): Promise<number> {
    const keysToDelete = Array.isArray(keys) ? keys : [keys];
    if (keysToDelete.length === 0) {
      return Promise.resolve(0);
    }
    return this.redisClient.del(keysToDelete);
  }
  /**
   * 设置哈希表
   * @param key 键
   * @param data 数据
   * @returns 是否成功
   */
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
  /**
   * 获取哈希表所有字段和值
   * @param key 键
   * @returns 哈希表所有字段和值
   */
  hgetall(key: string): Promise<Record<string, string>> {
    return this.redisClient.hgetall(key);
  }
  /**
   * 扫描删除
   * @param pattern 模式
   * @returns 是否成功
   */
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
  /**
   * 增加计数
   * @param key 键
   * @returns 计数
   */
  incr(key: string): Promise<number> {
    return this.redisClient.incr(key);
  }
  /**
   * 设置过期时间
   * @param key 键
   * @param ttl 过期时间
   * @returns 是否成功
   */
  expire(key: string, ttl: number): Promise<number> {
    return this.redisClient.expire(key, ttl);
  }
  /**
   * 获取 Redis 客户端
   * @returns Redis 客户端
   */
  get client(): Redis {
    return this.redisClient;
  }
}
