import { Controller, Post, Body } from '@nestjs/common';
import { PermissionService } from './permission.service';
import {
  AddPolicyDto,
  RemovePolicyDto,
  GetPermissionsForRoleDto,
} from '@app/shared-dto-lib';

/**
 * 权限管理控制器
 * @description 处理权限相关的HTTP请求，转发到IAM服务
 */
@Controller('api/iam')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  /**
   * 添加权限策略
   * @description 为指定角色添加权限策略
   * @param addPolicyDto 添加权限策略信息
   * @returns 添加结果
   */
  @Post('add-policy')
  addPolicy(@Body() addPolicyDto: AddPolicyDto) {
    return this.permissionService.addPolicy(addPolicyDto);
  }

  /**
   * 删除权限策略
   * @description 删除指定角色的权限策略
   * @param removePolicyDto 删除权限策略信息
   * @returns 删除结果
   */
  @Post('remove-policy')
  removePolicy(@Body() removePolicyDto: RemovePolicyDto) {
    return this.permissionService.removePolicy(removePolicyDto);
  }

  /**
   * 获取角色权限
   * @description 获取指定角色的所有权限
   * @param getPermissionsForRoleDto 获取权限信息
   * @returns 角色权限列表
   */
  @Post('get-permissions-for-role')
  getPermissionsForRole(
    @Body() getPermissionsForRoleDto: GetPermissionsForRoleDto,
  ) {
    return this.permissionService.getPermissionsForRole(
      getPermissionsForRoleDto,
    );
  }
}
