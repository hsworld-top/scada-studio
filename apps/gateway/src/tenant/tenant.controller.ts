import {
  Controller,
  Ip,
  ValidationPipe,
  UseGuards,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { Post, Body, Req, Get, Param, Patch, Delete } from '@nestjs/common';
import {
  CreateTenantDto,
  UpdateTenantBaseDto,
  CreateAdminDto,
  DeleteAdminDto,
  ChangeAdminPasswordDto,
  AdminLoginDto,
} from '@app/shared-dto-lib';
import { PlatformSessionGuard } from '../guards/platform-session.guard';
@Controller('api/tenant')
export class TenantController {
  constructor(
    @Inject('PLATFORM_CORE_SERVICE')
    private readonly platformCoreClient: ClientProxy,
    @Inject('IAM_SERVICE')
    private readonly iamService: ClientProxy,
  ) {}
  // 平台管理员登录
  @Post('login')
  login(@Ip() ip: string, @Body(new ValidationPipe()) body: AdminLoginDto) {
    return this.platformCoreClient.send('login', {
      username: body.username,
      password: body.password,
      ip: ip,
    });
  }
  // 平台管理员登出
  @Post('logout')
  @UseGuards(PlatformSessionGuard)
  logout(@Ip() ip: string, @Req() req) {
    return this.platformCoreClient.send('logout', {
      ip: ip,
      userId: req.user.userId,
      sessionId: req.user.sessionId,
    });
  }
  // 创建平台管理员
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
  // 删除平台管理员
  @Delete('deleteAdmin')
  @UseGuards(PlatformSessionGuard)
  deleteAdmin(@Req() req, @Body(new ValidationPipe()) body: DeleteAdminDto) {
    return this.platformCoreClient.send('deleteAdmin', {
      id: body.id,
      userId: req.user.userId,
      sessionId: req.user.sessionId,
    });
  }
  // 获取平台管理员列表
  @Get('listAdmins')
  @UseGuards(PlatformSessionGuard)
  listAdmins(@Req() req) {
    return this.platformCoreClient.send('listAdmins', {
      userId: req.user.userId,
      sessionId: req.user.sessionId,
    });
  }
  // 修改平台管理员密码
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

  // 查询所有的租户标识
  @Get('/slugs')
  getTenantSlugs() {
    return this.platformCoreClient.send('listSlugs', {});
  }
  // 根据租户标识查询单个租户
  @Get('/slug/:slug')
  @UseGuards(PlatformSessionGuard)
  getTenantBySlug(@Req() req, @Param('slug') slug: string) {
    return this.platformCoreClient.send('getTenantBySlug', {
      slug,
      userId: req.user.userId,
      sessionId: req.user.sessionId,
    });
  }
  // 查询单个租户
  @Get('/:id')
  @UseGuards(PlatformSessionGuard)
  getTenant(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.platformCoreClient.send('getTenant', {
      id,
      userId: req.user.userId,
      sessionId: req.user.sessionId,
    });
  }
  // 更新租户
  @Patch('/:id')
  @UseGuards(PlatformSessionGuard)
  updateTenant(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe()) body: UpdateTenantBaseDto,
  ) {
    return this.platformCoreClient.send('updateTenant', {
      id,
      name: body?.name,
      slug: body?.slug,
      status: body?.status,
      quota: body?.quota,
      userId: req.user.userId,
      sessionId: req.user.sessionId,
    });
  }
  // 删除租户
  @Delete('/:id')
  @UseGuards(PlatformSessionGuard)
  deleteTenant(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.platformCoreClient.send('deleteTenant', {
      id,
      userId: req.user.userId,
      sessionId: req.user.sessionId,
    });
  }
  // 租户管理 创建租户
  @Post('/')
  @UseGuards(PlatformSessionGuard)
  async createTenant(
    @Req() req,
    @Body(new ValidationPipe()) body: CreateTenantDto,
  ): Promise<any> {
    const res = await firstValueFrom(
      this.platformCoreClient.send('createTenant', {
        name: body.name,
        slug: body.slug,
        quota: body.quota,
        userId: req.user.userId,
        sessionId: req.user.sessionId,
      }),
    );
    // 初始化租户，在iam-service中创建初始管理员、初始角色、初始用户组、初始权限
    const iamRes = await firstValueFrom(
      this.iamService.send('iam.tenant.init', {
        tenantId: res.data.id,
      }),
    );
    return {
      ...res,
      iamRes,
    };
  }
  // 查询所有租户
  @Get('/')
  @UseGuards(PlatformSessionGuard)
  listTenants(@Req() req) {
    return this.platformCoreClient.send('listTenants', {
      userId: req.user.userId,
      sessionId: req.user.sessionId,
    });
  }
}
