import { Injectable } from '@nestjs/common';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { AppLogger } from '@app/logger-lib';
import { TypeOrmNestLogger } from './typeorm-logger';

@Injectable()
export class PgLibService implements TypeOrmOptionsFactory {
  constructor() {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const isProd = process.env.NODE_ENV === 'production';
    return {
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'postgres',
      autoLoadEntities: true,
      synchronize: !isProd, // 更安全的 synchronize 开关
      logger: new TypeOrmNestLogger(
        new AppLogger({
          service: 'typeorm',
          context: 'TypeORM',
          env: process.env.NODE_ENV as any,
        }),
      ),
      logging: isProd ? ['error', 'warn'] : 'all',
      extra: {
        max: Number(process.env.DB_POOL_SIZE) || 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      },
    };
  }
}
