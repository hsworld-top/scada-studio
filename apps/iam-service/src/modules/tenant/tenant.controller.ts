import { Controller, ValidationPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RoleService } from '../role/role.service';
import { UserService } from '../user/user.service';
import { ResponseCode } from '@app/api-response-lib';
import { InitTenantDto } from '@app/shared-dto-lib';

@Controller()
export class TenantController {
  constructor(
    private readonly roleService: RoleService,
    private readonly userService: UserService,
  ) {}
  /**
   * 初始化租户
   * @param payload 租户ID
   * @returns 初始化结果
   */
  @MessagePattern('iam.tenant.init')
  async init(@Payload(new ValidationPipe()) payload: InitTenantDto) {
    // 创建管理员角色
    const adminRole = await this.roleService.create({
      name: 'system_admin',
      description: '系统管理员角色',
      tenantId: payload.tenantId,
    });
    // 创建初始管理员账户
    const adminUser = await this.userService.create({
      username: process.env.IAM_ADMIN_USERNAME || 'admin',
      password: process.env.IAM_ADMIN_PASSWORD || 'admin',
      tenantId: payload.tenantId,
      roleIds: [adminRole.id],
    });
    return {
      code: ResponseCode.SUCCESS,
      msg: 'iam.tenant.init_success',
      data: {
        adminRole,
        adminUser,
      },
    };
  }
}
