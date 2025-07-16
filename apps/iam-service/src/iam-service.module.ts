import { Module } from '@nestjs/common';
import { IamServiceController } from './iam-service.controller';
import { IamServiceService } from './iam-service.service';

@Module({
  imports: [],
  controllers: [IamServiceController],
  providers: [IamServiceService],
})
export class IamServiceModule {}
