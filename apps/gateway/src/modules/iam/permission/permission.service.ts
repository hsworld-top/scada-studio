import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  AddPolicyDto,
  RemovePolicyDto,
  GetPermissionsForRoleDto,
} from '@app/shared-dto-lib';

/**
 * 权限管理服务
 * @description 转发权限相关请求到IAM服务
 */
@Injectable()
export class PermissionService {
  constructor(
    @Inject('IAM_SERVICE') private readonly iamServiceClient: ClientProxy,
  ) {}

  /**
   * 添加权限策略
   * @description 调用IAM服务为指定角色添加权限策略
   * @param addPolicyDto 添加权限策略信息
   * @returns 添加结果
   */
  addPolicy(addPolicyDto: AddPolicyDto) {
    return this.iamServiceClient.send('iam.permission.addPolicy', addPolicyDto);
  }

  /**
   * 删除权限策略
   * @description 调用IAM服务删除指定角色的权限策略
   * @param removePolicyDto 删除权限策略信息
   * @returns 删除结果
   */
  removePolicy(removePolicyDto: RemovePolicyDto) {
    return this.iamServiceClient.send(
      'iam.permission.removePolicy',
      removePolicyDto,
    );
  }

  /**
   * 获取角色权限
   * @description 调用IAM服务获取指定角色的所有权限
   * @param getPermissionsForRoleDto 获取权限信息
   * @returns 角色权限列表
   */
  getPermissionsForRole(getPermissionsForRoleDto: GetPermissionsForRoleDto) {
    return this.iamServiceClient.send(
      'iam.permission.getPermissionsForRole',
      getPermissionsForRoleDto,
    );
  }
}
