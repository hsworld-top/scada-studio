import { Module } from '@nestjs/common'; // 导入 Module 装饰器
import { CasbinService } from './casbin.service'; // 导入 CasbinService
import { ConfigModule } from '@nestjs/config'; // 导入 ConfigModule
import { RedisLibModule } from '@app/redis-lib'; // 导入 RedisLibModule

@Module({
  imports: [ConfigModule, RedisLibModule],
  providers: [CasbinService],
  exports: [CasbinService],
})
export class CasbinModule {}
