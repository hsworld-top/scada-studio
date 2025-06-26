import { Module } from '@nestjs/common';
import { CasbinService } from './casbin.service';
import { ConfigModule } from '@nestjs/config';
import { RedisLibModule } from '@app/redis-lib';

@Module({
  imports: [ConfigModule, RedisLibModule],
  providers: [CasbinService],
  exports: [CasbinService],
})
export class CasbinModule {}
