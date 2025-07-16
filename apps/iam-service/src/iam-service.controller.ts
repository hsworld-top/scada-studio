import { Controller, Get } from '@nestjs/common';
import { IamServiceService } from './iam-service.service';

@Controller()
export class IamServiceController {
  constructor(private readonly iamServiceService: IamServiceService) {}

  @Get()
  getHello(): string {
    return this.iamServiceService.getHello();
  }
}
