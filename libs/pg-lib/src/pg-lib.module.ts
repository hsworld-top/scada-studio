import { Module } from '@nestjs/common';
import { PgLibService } from './pg-lib.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [PgLibService],
  exports: [PgLibService],
})
export class PgLibModule {}
