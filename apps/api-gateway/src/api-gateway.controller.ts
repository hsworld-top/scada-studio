import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiGatewayService } from './api-gateway.service';

@Controller()
export class ApiGatewayController {
  constructor(private readonly apiGatewayService: ApiGatewayService) {}

  @Get('hello')
  getHello(): string {
    return this.apiGatewayService.getHello();
  }
  @Post('create-admin')
  createAdmin(@Body() createAdminDto: any) {
    return this.apiGatewayService.createAdmin(createAdminDto);
  }
}
