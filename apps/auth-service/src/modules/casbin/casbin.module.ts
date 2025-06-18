import { Module } from '@nestjs/common';
import { CasbinService } from './casbin.service';
import { ConfigModule } from '@nestjs/config';
import { RedisLibModule } from '@app/redis-lib';

@Module({
  // 只需要导入它所依赖的服务所在的模块
  imports: [ConfigModule, RedisLibModule],
  // 只提供 CasbinService
  providers: [CasbinService],
  // 导出 CasbinService
  exports: [CasbinService],
})
export class CasbinModule {}
