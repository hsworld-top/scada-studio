import { Module } from '@nestjs/common';
import { ApiGatewayController } from './api-gateway.controller';
import { ApiGatewayService } from './api-gateway.service';
import { WebscoketMngGateway } from './webscoket-mng/webscoket-mng.gateway';

@Module({
  imports: [],
  controllers: [ApiGatewayController],
  providers: [ApiGatewayService, WebscoketMngGateway],
})
export class ApiGatewayModule {}
