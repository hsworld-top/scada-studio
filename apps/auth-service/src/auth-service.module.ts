import { Module } from '@nestjs/common';
import { AuthServiceController } from './auth-service.controller';
import { AuthServiceService } from './auth-service.service';
import { LoggerLibModule } from '@app/logger-lib';

@Module({
  imports: [
    LoggerLibModule.forRoot({
      serviceName: 'auth-service',
      logPath: 'logs/auth-service',
      logLevel: 'info',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 7, // 保留7天
      zippedArchive: true,
    }),
  ],
  controllers: [AuthServiceController],
  providers: [AuthServiceService],
})
export class AuthServiceModule {}
