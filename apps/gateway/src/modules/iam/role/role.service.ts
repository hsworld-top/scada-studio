import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  CreateRoleDto,
  FindRolesDto,
  UpdateRoleDto,
  FindOneRoleDto,
  RemoveRoleDto,
} from '@app/shared-dto-lib';

/**
 * 角色管理服务
 * @description 转发角色相关请求到IAM服务
 */
@Injectable()
export class RoleService {
  constructor(
    @Inject('IAM_SERVICE') private readonly iamServiceClient: ClientProxy,
  ) {}

  /**
   * 创建角色
   * @description 调用IAM服务创建新角色
   * @param createRoleDto 创建角色信息
   * @returns 创建的角色信息
   */
  create(createRoleDto: CreateRoleDto) {
    return this.iamServiceClient.send('iam.role.create', createRoleDto);
  }

  /**
   * 查找所有角色
   * @description 调用IAM服务获取指定租户下的所有角色
   * @param findRolesDto 查询条件
   * @returns 角色列表
   */
  findAll(findRolesDto: FindRolesDto) {
    return this.iamServiceClient.send('iam.role.findAll', findRolesDto);
  }

  /**
   * 查找单个角色
   * @description 调用IAM服务获取指定角色的详细信息
   * @param findOneRoleDto 查询条件
   * @returns 角色详细信息
   */
  findOne(findOneRoleDto: FindOneRoleDto) {
    return this.iamServiceClient.send('iam.role.findOne', findOneRoleDto);
  }

  /**
   * 更新角色
   * @description 调用IAM服务更新角色信息
   * @param updateRoleDto 更新角色信息
   * @returns 更新后的角色信息
   */
  update(updateRoleDto: UpdateRoleDto) {
    return this.iamServiceClient.send('iam.role.update', updateRoleDto);
  }

  /**
   * 删除角色
   * @description 调用IAM服务删除角色
   * @param removeRoleDto 删除角色信息
   * @returns 删除结果
   */
  remove(removeRoleDto: RemoveRoleDto) {
    return this.iamServiceClient.send('iam.role.remove', removeRoleDto);
  }
}
