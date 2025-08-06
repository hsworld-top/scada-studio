import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  CreateGroupDto,
  UpdateGroupDto,
  FindGroupsDto,
  FindOneGroupDto,
  RemoveGroupDto,
  AddUsersToGroupDto,
  RemoveUsersFromGroupDto,
} from '@app/shared-dto-lib';

/**
 * 用户组管理服务
 * @description 转发用户组相关请求到IAM服务
 */
@Injectable()
export class GroupService {
  constructor(
    @Inject('IAM_SERVICE') private readonly iamServiceClient: ClientProxy,
  ) {}

  /**
   * 创建用户组
   * @description 调用IAM服务创建新用户组
   * @param createGroupDto 创建用户组信息
   * @returns 创建的用户组信息
   */
  create(createGroupDto: CreateGroupDto) {
    return this.iamServiceClient.send('iam.group.create', createGroupDto);
  }

  /**
   * 查找所有用户组
   * @description 调用IAM服务获取指定租户下的所有用户组
   * @param findGroupsDto 查询条件
   * @returns 用户组列表
   */
  findAll(findGroupsDto: FindGroupsDto) {
    return this.iamServiceClient.send('iam.group.findAll', findGroupsDto);
  }

  /**
   * 查找单个用户组
   * @description 调用IAM服务获取指定用户组的详细信息
   * @param findOneGroupDto 查询条件
   * @returns 用户组详细信息
   */
  findOne(findOneGroupDto: FindOneGroupDto) {
    return this.iamServiceClient.send('iam.group.findOne', findOneGroupDto);
  }

  /**
   * 更新用户组
   * @description 调用IAM服务更新用户组信息
   * @param updateGroupDto 更新用户组信息
   * @returns 更新后的用户组信息
   */
  update(updateGroupDto: UpdateGroupDto) {
    return this.iamServiceClient.send('iam.group.update', updateGroupDto);
  }

  /**
   * 删除用户组
   * @description 调用IAM服务删除用户组
   * @param removeGroupDto 删除用户组信息
   * @returns 删除结果
   */
  remove(removeGroupDto: RemoveGroupDto) {
    return this.iamServiceClient.send('iam.group.remove', removeGroupDto);
  }

  /**
   * 向用户组添加用户
   * @description 调用IAM服务向用户组添加用户
   * @param addUsersToGroupDto 添加用户信息
   * @returns 更新后的用户组信息
   */
  addUsers(addUsersToGroupDto: AddUsersToGroupDto) {
    return this.iamServiceClient.send('iam.group.addUsers', addUsersToGroupDto);
  }

  /**
   * 从用户组移除用户
   * @description 调用IAM服务从用户组移除用户
   * @param removeUsersFromGroupDto 移除用户信息
   * @returns 更新后的用户组信息
   */
  removeUsers(removeUsersFromGroupDto: RemoveUsersFromGroupDto) {
    return this.iamServiceClient.send(
      'iam.group.removeUsers',
      removeUsersFromGroupDto,
    );
  }
}
