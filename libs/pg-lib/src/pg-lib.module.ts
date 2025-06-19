import { Module } from '@nestjs/common';
import { PgLibService } from './pg-lib.service';

@Module({
  imports: [],
  providers: [PgLibService],
  exports: [PgLibService],
})
export class PgLibModule {}
