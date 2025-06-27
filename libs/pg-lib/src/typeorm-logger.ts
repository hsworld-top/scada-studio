import { AppLogger } from '@app/logger-lib';
import { Logger as TypeOrmLogger, QueryRunner } from 'typeorm';

export class TypeOrmNestLogger implements TypeOrmLogger {
  constructor(private readonly logger: AppLogger) {}

  logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner) {
    this.logger.log(
      `[TypeORM][QUERY] ${query} -- ${JSON.stringify(parameters)}`,
    );
  }
  logQueryError(
    error: string,
    query: string,
    parameters?: any[],
    queryRunner?: QueryRunner,
  ) {
    this.logger.error(
      `[TypeORM][ERROR] ${error} -- ${query} -- ${JSON.stringify(parameters)}`,
    );
  }
  logQuerySlow(
    time: number,
    query: string,
    parameters?: any[],
    queryRunner?: QueryRunner,
  ) {
    this.logger.warn(
      `[TypeORM][SLOW] ${time}ms -- ${query} -- ${JSON.stringify(parameters)}`,
    );
  }
  logSchemaBuild(message: string, queryRunner?: QueryRunner) {
    this.logger.log(`[TypeORM][SCHEMA] ${message}`);
  }
  logMigration(message: string, queryRunner?: QueryRunner) {
    this.logger.log(`[TypeORM][MIGRATION] ${message}`);
  }
  log(level: 'log' | 'info' | 'warn', message: any, queryRunner?: QueryRunner) {
    if (level === 'log' || level === 'info') {
      this.logger.log(`[TypeORM] ${message}`);
    } else if (level === 'warn') {
      this.logger.warn(`[TypeORM] ${message}`);
    }
  }
}
