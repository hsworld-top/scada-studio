import {
  Controller,
  Ip,
  ValidationPipe,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { Post, Body, Req, Get, Param, Patch, Delete } from '@nestjs/common';
import {
  CreateTenantDto,
  UpdateTenantDto,
  CreateAdminDto,
  DeleteAdminDto,
  GetAdminDto,
  ChangeAdminPasswordDto,
  adminLoginDto,
} from '@app/shared-dto-lib';
import { PlatformSessionGuard } from '../guards/platform-session.guard';
@Controller('api/tenant')
export class TenantController {
  constructor(
    @Inject('PLATFORM_CORE_SERVICE')
    private readonly platformCoreClient: ClientProxy,
  ) {}
  @Post('login')
  login(@Ip() ip: string, @Body(new ValidationPipe()) body: adminLoginDto) {
    return this.platformCoreClient.send('login', {
      username: body.username,
      password: body.password,
      ip: ip,
    });
  }
  @Post('logout')
  @UseGuards(PlatformSessionGuard)
  logout(@Ip() ip: string, @Req() req) {
    return this.platformCoreClient.send('logout', {
      ip: ip,
      userId: req.user.userId,
      sessionId: req.user.sessionId,
    });
  }
  @Post('createAdmin')
  @UseGuards(PlatformSessionGuard)
  createAdmin(@Req() req, @Body(new ValidationPipe()) body: CreateAdminDto) {
    return this.platformCoreClient.send('createAdmin', {
      username: body.username,
      password: body.password,
      userId: req.user.userId,
      sessionId: req.user.sessionId,
    });
  }
  @Delete('deleteAdmin')
  @UseGuards(PlatformSessionGuard)
  deleteAdmin(@Req() req, @Body(new ValidationPipe()) body: DeleteAdminDto) {
    return this.platformCoreClient.send('deleteAdmin', {
      id: body.id,
      userId: req.user.userId,
      sessionId: req.user.sessionId,
    });
  }
  @Get('listAdmins')
  @UseGuards(PlatformSessionGuard)
  listAdmins(@Req() req) {
    return this.platformCoreClient.send('listAdmins', {
      userId: req.user.userId,
      sessionId: req.user.sessionId,
    });
  }
  @Patch('changePassword')
  @UseGuards(PlatformSessionGuard)
  changePassword(
    @Req() req,
    @Body(new ValidationPipe()) body: ChangeAdminPasswordDto,
  ) {
    return this.platformCoreClient.send('changePassword', {
      id: body.id,
      password: body.password,
      userId: req.user.userId,
      sessionId: req.user.sessionId,
    });
  }
  @Post('/')
  @UseGuards(PlatformSessionGuard)
  createTenant(@Req() req, @Body(new ValidationPipe()) body: CreateTenantDto) {
    return this.platformCoreClient.send('createTenant', {
      name: body.name,
      slug: body.slug,
      userId: req.user.userId,
      sessionId: req.user.sessionId,
    });
  }
  @Get('/')
  @UseGuards(PlatformSessionGuard)
  listTenants(@Req() req) {
    return this.platformCoreClient.send('listTenants', {
      userId: req.user.userId,
      sessionId: req.user.sessionId,
    });
  }
  @Get('/:id')
  @UseGuards(PlatformSessionGuard)
  getTenant(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.platformCoreClient.send('getTenant', {
      id,
      userId: req.user.userId,
      sessionId: req.user.sessionId,
    });
  }
  @Patch('/:id')
  @UseGuards(PlatformSessionGuard)
  updateTenant(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe()) body: UpdateTenantDto,
  ) {
    return this.platformCoreClient.send('updateTenant', {
      id,
      name: body?.name,
      slug: body?.slug,
      status: body?.status,
      userId: req.user.userId,
      sessionId: req.user.sessionId,
    });
  }
  @Delete('/:id')
  @UseGuards(PlatformSessionGuard)
  deleteTenant(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.platformCoreClient.send('deleteTenant', {
      id,
      userId: req.user.userId,
      sessionId: req.user.sessionId,
    });
  }
}
