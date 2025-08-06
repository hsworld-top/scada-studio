import {
  Controller,
  Ip,
  ValidationPipe,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { Post, Body, Req, Get, Param, Patch, Delete } from '@nestjs/common';
import {
  CreateTenantDto,
  UpdateTenantBaseDto,
  CreateAdminDto,
  DeleteAdminDto,
  ChangeAdminPasswordDto,
  AdminLoginDto,
} from '@app/shared-dto-lib';
import { PlatformSessionGuard } from '../../guards/platform-session.guard';
import { TenantService } from './tenant.service';

/**
 * 租户管理控制器
 * @description 处理租户相关的HTTP请求
 */
@Controller('api/tenant')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}
  /**
   * 平台管理员登录
   * @param ip 客户端IP地址
   * @param body 登录数据
   * @returns 登录结果
   */
  @Post('login')
  login(@Ip() ip: string, @Body(new ValidationPipe()) body: AdminLoginDto) {
    return this.tenantService.login(ip, body);
  }

  /**
   * 平台管理员登出
   * @param ip 客户端IP地址
   * @param req 请求对象
   * @returns 登出结果
   */
  @Post('logout')
  @UseGuards(PlatformSessionGuard)
  logout(@Ip() ip: string, @Req() req) {
    return this.tenantService.logout(ip, {
      userId: req.user.userId,
      sessionId: req.user.sessionId,
    });
  }

  /**
   * 创建平台管理员
   * @param req 请求对象
   * @param body 管理员数据
   * @returns 创建结果
   */
  @Post('createAdmin')
  @UseGuards(PlatformSessionGuard)
  createAdmin(@Req() req, @Body(new ValidationPipe()) body: CreateAdminDto) {
    return this.tenantService.createAdmin(
      {
        userId: req.user.userId,
        sessionId: req.user.sessionId,
      },
      body,
    );
  }

  /**
   * 删除平台管理员
   * @param req 请求对象
   * @param body 删除数据
   * @returns 删除结果
   */
  @Delete('deleteAdmin')
  @UseGuards(PlatformSessionGuard)
  deleteAdmin(@Req() req, @Body(new ValidationPipe()) body: DeleteAdminDto) {
    return this.tenantService.deleteAdmin(
      {
        userId: req.user.userId,
        sessionId: req.user.sessionId,
      },
      body,
    );
  }

  /**
   * 获取平台管理员列表
   * @param req 请求对象
   * @returns 管理员列表
   */
  @Get('listAdmins')
  @UseGuards(PlatformSessionGuard)
  listAdmins(@Req() req) {
    return this.tenantService.listAdmins({
      userId: req.user.userId,
      sessionId: req.user.sessionId,
    });
  }

  /**
   * 修改平台管理员密码
   * @param req 请求对象
   * @param body 密码数据
   * @returns 修改结果
   */
  @Patch('changePassword')
  @UseGuards(PlatformSessionGuard)
  changePassword(
    @Req() req,
    @Body(new ValidationPipe()) body: ChangeAdminPasswordDto,
  ) {
    return this.tenantService.changePassword(
      {
        userId: req.user.userId,
        sessionId: req.user.sessionId,
      },
      body,
    );
  }

  /**
   * 查询所有的租户标识
   * @returns 租户标识列表
   */
  @Get('/slugs')
  getTenantSlugs() {
    return this.tenantService.getTenantSlugs();
  }

  /**
   * 根据租户标识查询单个租户
   * @param req 请求对象
   * @param slug 租户标识
   * @returns 租户信息
   */
  @Get('/slug/:slug')
  @UseGuards(PlatformSessionGuard)
  getTenantBySlug(@Req() req, @Param('slug') slug: string) {
    return this.tenantService.getTenantBySlug(
      {
        userId: req.user.userId,
        sessionId: req.user.sessionId,
      },
      slug,
    );
  }

  /**
   * 查询单个租户
   * @param req 请求对象
   * @param id 租户ID
   * @returns 租户信息
   */
  @Get('/:id')
  @UseGuards(PlatformSessionGuard)
  getTenant(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.tenantService.getTenant(
      {
        userId: req.user.userId,
        sessionId: req.user.sessionId,
      },
      id,
    );
  }

  /**
   * 更新租户
   * @param req 请求对象
   * @param id 租户ID
   * @param body 更新数据
   * @returns 更新结果
   */
  @Patch('/:id')
  @UseGuards(PlatformSessionGuard)
  updateTenant(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe()) body: UpdateTenantBaseDto,
  ) {
    return this.tenantService.updateTenant(
      {
        userId: req.user.userId,
        sessionId: req.user.sessionId,
      },
      id,
      body,
    );
  }

  /**
   * 删除租户
   * @param req 请求对象
   * @param id 租户ID
   * @returns 删除结果
   */
  @Delete('/:id')
  @UseGuards(PlatformSessionGuard)
  deleteTenant(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.tenantService.deleteTenant(
      {
        userId: req.user.userId,
        sessionId: req.user.sessionId,
      },
      id,
    );
  }

  /**
   * 创建租户
   * @param req 请求对象
   * @param body 租户数据
   * @returns 创建结果
   */
  @Post('/')
  @UseGuards(PlatformSessionGuard)
  async createTenant(
    @Req() req,
    @Body(new ValidationPipe()) body: CreateTenantDto,
  ): Promise<any> {
    return await this.tenantService.createTenant(
      {
        userId: req.user.userId,
        sessionId: req.user.sessionId,
      },
      body,
    );
  }

  /**
   * 查询所有租户
   * @param req 请求对象
   * @returns 租户列表
   */
  @Get('/')
  @UseGuards(PlatformSessionGuard)
  listTenants(@Req() req) {
    return this.tenantService.listTenants({
      userId: req.user.userId,
      sessionId: req.user.sessionId,
    });
  }
}
