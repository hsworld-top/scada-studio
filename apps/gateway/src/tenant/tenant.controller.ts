import { Controller } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Post, Body, Req } from '@nestjs/common';
import { CreateTenantDto } from '@app/shared-dto-lib';

@Controller('api/tenant')
export class TenantController {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    private readonly i18n: I18nService,
  ) {}
  @Post()
  createTenant(@Req() req, @Body() body: CreateTenantDto) {
    return this.authClient.send('createTenant', {
      ...body,
      token: req.user.token,
    });
  }
}
