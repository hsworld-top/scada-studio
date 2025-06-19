import { Module, forwardRef } from '@nestjs/common';
import { CasbinService } from './casbin.service';
import { ConfigModule } from '@nestjs/config';
import { RedisLibModule } from '@app/redis-lib';

@Module({
  imports: [ConfigModule, forwardRef(() => RedisLibModule)],
  providers: [CasbinService],
  exports: [CasbinService],
})
export class CasbinModule {}
