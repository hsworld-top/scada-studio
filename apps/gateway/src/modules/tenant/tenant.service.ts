import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  CreateTenantDto,
  UpdateTenantBaseDto,
  CreateAdminDto,
  DeleteAdminDto,
  ChangeAdminPasswordDto,
  AdminLoginDto,
} from '@app/shared-dto-lib';

/**
 * 租户管理服务
 * @description 处理租户相关的业务逻辑，转发请求到平台核心服务
 */
@Injectable()
export class TenantService {
  constructor(
    @Inject('PLATFORM_CORE_SERVICE')
    private readonly platformCoreClient: ClientProxy,
    @Inject('IAM_SERVICE')
    private readonly iamService: ClientProxy,
  ) {}

  /**
   * 平台管理员登录
   * @param ip 客户端IP地址
   * @param loginData 登录数据
   * @returns 登录结果
   */
  login(ip: string, loginData: AdminLoginDto) {
    return this.platformCoreClient.send('login', {
      username: loginData.username,
      password: loginData.password,
      ip: ip,
    });
  }

  /**
   * 平台管理员登出
   * @param ip 客户端IP地址
   * @param userInfo 用户信息
   * @returns 登出结果
   */
  logout(ip: string, userInfo: { userId: string; sessionId: string }) {
    return this.platformCoreClient.send('logout', {
      ip: ip,
      userId: userInfo.userId,
      sessionId: userInfo.sessionId,
    });
  }

  /**
   * 创建平台管理员
   * @param userInfo 用户信息
   * @param adminData 管理员数据
   * @returns 创建结果
   */
  createAdmin(
    userInfo: { userId: string; sessionId: string },
    adminData: CreateAdminDto,
  ) {
    return this.platformCoreClient.send('createAdmin', {
      username: adminData.username,
      password: adminData.password,
      userId: userInfo.userId,
      sessionId: userInfo.sessionId,
    });
  }

  /**
   * 删除平台管理员
   * @param userInfo 用户信息
   * @param deleteData 删除数据
   * @returns 删除结果
   */
  deleteAdmin(
    userInfo: { userId: string; sessionId: string },
    deleteData: DeleteAdminDto,
  ) {
    return this.platformCoreClient.send('deleteAdmin', {
      id: deleteData.id,
      userId: userInfo.userId,
      sessionId: userInfo.sessionId,
    });
  }

  /**
   * 获取平台管理员列表
   * @param userInfo 用户信息
   * @returns 管理员列表
   */
  listAdmins(userInfo: { userId: string; sessionId: string }) {
    return this.platformCoreClient.send('listAdmins', {
      userId: userInfo.userId,
      sessionId: userInfo.sessionId,
    });
  }

  /**
   * 修改平台管理员密码
   * @param userInfo 用户信息
   * @param passwordData 密码数据
   * @returns 修改结果
   */
  changePassword(
    userInfo: { userId: string; sessionId: string },
    passwordData: ChangeAdminPasswordDto,
  ) {
    return this.platformCoreClient.send('changePassword', {
      id: passwordData.id,
      password: passwordData.password,
      userId: userInfo.userId,
      sessionId: userInfo.sessionId,
    });
  }

  /**
   * 查询所有的租户标识
   * @returns 租户标识列表
   */
  getTenantSlugs() {
    return this.platformCoreClient.send('listSlugs', {});
  }

  /**
   * 根据租户标识查询单个租户
   * @param userInfo 用户信息
   * @param slug 租户标识
   * @returns 租户信息
   */
  getTenantBySlug(
    userInfo: { userId: string; sessionId: string },
    slug: string,
  ) {
    return this.platformCoreClient.send('getTenantBySlug', {
      slug,
      userId: userInfo.userId,
      sessionId: userInfo.sessionId,
    });
  }

  /**
   * 查询单个租户
   * @param userInfo 用户信息
   * @param id 租户ID
   * @returns 租户信息
   */
  getTenant(userInfo: { userId: string; sessionId: string }, id: number) {
    return this.platformCoreClient.send('getTenant', {
      id,
      userId: userInfo.userId,
      sessionId: userInfo.sessionId,
    });
  }

  /**
   * 更新租户
   * @param userInfo 用户信息
   * @param id 租户ID
   * @param updateData 更新数据
   * @returns 更新结果
   */
  updateTenant(
    userInfo: { userId: string; sessionId: string },
    id: number,
    updateData: UpdateTenantBaseDto,
  ) {
    return this.platformCoreClient.send('updateTenant', {
      id,
      name: updateData?.name,
      slug: updateData?.slug,
      status: updateData?.status,
      quota: updateData?.quota,
      userId: userInfo.userId,
      sessionId: userInfo.sessionId,
    });
  }

  /**
   * 删除租户
   * @param userInfo 用户信息
   * @param id 租户ID
   * @returns 删除结果
   */
  deleteTenant(userInfo: { userId: string; sessionId: string }, id: number) {
    return this.platformCoreClient.send('deleteTenant', {
      id,
      userId: userInfo.userId,
      sessionId: userInfo.sessionId,
    });
  }

  /**
   * 创建租户
   * @param userInfo 用户信息
   * @param tenantData 租户数据
   * @returns 创建结果
   */
  async createTenant(
    userInfo: { userId: string; sessionId: string },
    tenantData: CreateTenantDto,
  ) {
    const res = await firstValueFrom(
      this.platformCoreClient.send('createTenant', {
        name: tenantData.name,
        slug: tenantData.slug,
        quota: tenantData.quota,
        userId: userInfo.userId,
        sessionId: userInfo.sessionId,
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

  /**
   * 查询所有租户
   * @param userInfo 用户信息
   * @returns 租户列表
   */
  listTenants(userInfo: { userId: string; sessionId: string }) {
    return this.platformCoreClient.send('listTenants', {
      userId: userInfo.userId,
      sessionId: userInfo.sessionId,
    });
  }
}
