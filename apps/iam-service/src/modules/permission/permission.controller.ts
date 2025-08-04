import { Controller, UseGuards, ValidationPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CasbinService } from '../casbin/casbin.service';
import { ResponseCode } from '@app/api-response-lib';
import { AppLogger } from '@app/logger-lib';
import {
  AddPolicyDto,
  RemovePolicyDto,
  GetPermissionsForRoleDto,
} from '@app/shared-dto-lib'; // 假设你已经在 shared-dto-lib 中定义了这些 DTO
import { CasbinGuard } from '../../common/guard/casbin.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

/**
 * 权限控制器
 */
@Controller('permission')
@UseGuards(CasbinGuard) // 对整个控制器启用权限守卫
export class PermissionController {
  constructor(
    private readonly casbinService: CasbinService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(PermissionController.name);
  }
  /**
   * 添加权限策略
   * @param payload
   * @returns
   */
  @MessagePattern('iam.permission.addPolicy')
  @Permissions('permission', 'manage')
  async addPolicy(@Payload(new ValidationPipe()) payload: AddPolicyDto) {
    const { role, tenantId, resource, action } = payload;
    const result = await this.casbinService.addPolicy(
      role,
      String(tenantId),
      resource,
      action,
    );
    return {
      code: ResponseCode.SUCCESS,
      data: result,
      msg: 'iam.permission.addPolicy_success',
    };
  }

  /**
   * 删除权限策略
   * @param payload
   * @returns
   */
  @MessagePattern('iam.permission.removePolicy')
  @Permissions('permission', 'manage')
  async removePolicy(@Payload(new ValidationPipe()) payload: RemovePolicyDto) {
    const { role, tenantId, resource, action } = payload;
    const result = await this.casbinService.removePolicy(
      role,
      String(tenantId),
      resource,
      action,
    );
    return {
      code: ResponseCode.SUCCESS,
      data: result,
      msg: 'iam.permission.removePolicy_success',
    };
  }

  /**
   * 获取角色权限
   * @param payload
   * @returns
   */
  @MessagePattern('iam.permission.getPermissionsForRole')
  @Permissions('permission', 'manage')
  async getPermissionsForRole(
    @Payload(new ValidationPipe()) payload: GetPermissionsForRoleDto,
  ) {
    const { role, tenantId } = payload;
    const result = await this.casbinService.getPermissionsForRole(
      role,
      String(tenantId),
    );
    return {
      code: ResponseCode.SUCCESS,
      data: result,
      msg: 'iam.permission.getPermissionsForRole_success',
    };
  }

  // 你可以继续为 CasbinService 中的其他方法（如 addRoleForUser, removeRoleForUser 等）添加接口
}
