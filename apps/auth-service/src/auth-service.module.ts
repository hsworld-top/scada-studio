import { Module } from '@nestjs/common';
import { AuthServiceController } from './auth-service.controller';
import { AuthServiceService } from './auth-service.service';
import { RedisLibModule } from '@app/redis-lib'; // 引入公共库

@Module({
  imports: [RedisLibModule.register()],
  controllers: [AuthServiceController],
  providers: [AuthServiceService],
})
export class AuthServiceModule {}
