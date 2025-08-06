import { Controller, ValidationPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { GroupService } from './group.service';
import { AppLogger } from '@app/logger-lib';
import {
  CreateGroupDto,
  UpdateGroupDto,
  FindGroupsDto,
  FindOneGroupDto,
  RemoveGroupDto,
  AddUsersToGroupDto,
  RemoveUsersFromGroupDto,
} from '@app/shared-dto-lib';
import { ResponseCode } from '@app/shared-dto-lib';

/**
 * 用户组管理控制器
 * @description 处理用户组相关的微服务消息模式，提供用户组的增删改查功能
 * 用户组是用户管理的重要概念，可以批量管理用户权限，简化权限分配
 * 用户组可以关联多个角色，组内用户自动继承组的所有角色权限
 * 所有操作都基于租户隔离，确保不同租户的用户组数据相互独立
 */
@Controller()
export class GroupController {
  constructor(
    private readonly groupService: GroupService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext('GroupController');
  }

  /**
   * 创建新用户组
   * @description 在指定租户下创建新用户组，支持同时分配角色和添加用户
   * 用户组名在租户内必须唯一
   * @param payload 包含租户ID、用户组数据和操作者信息的载荷
   * @returns 创建成功的用户组信息，包括关联的角色和用户
   */
  @MessagePattern('iam.group.create')
  async create(@Payload(new ValidationPipe()) payload: CreateGroupDto) {
    const group = await this.groupService.create(payload);
    return {
      code: ResponseCode.SUCCESS,
      data: group,
      msg: 'iam.group.create_success',
    };
  }

  /**
   * 查询用户组列表
   * @description 获取指定租户下的所有用户组列表，包括每个组的角色和用户信息
   * @param payload 包含租户ID和操作者信息的载荷
   * @returns 用户组列表，包含关联的角色和用户信息
   */
  @MessagePattern('iam.group.findAll')
  async findAll(@Payload(new ValidationPipe()) payload: FindGroupsDto) {
    const groups = await this.groupService.findAll(payload.tenantId);
    return {
      code: ResponseCode.SUCCESS,
      data: groups,
      msg: 'iam.group.find_all_success',
    };
  }

  /**
   * 根据ID查询单个用户组
   * @description 获取指定租户下特定用户组的详细信息，包括关联的角色和用户
   * @param payload 包含租户ID、用户组ID和操作者信息的载荷
   * @returns 用户组详细信息，包含完整的关联数据
   */
  @MessagePattern('iam.group.findOne')
  async findOne(@Payload(new ValidationPipe()) payload: FindOneGroupDto) {
    const group = await this.groupService.findOne(payload);
    return {
      code: ResponseCode.SUCCESS,
      data: group,
      msg: 'iam.group.find_one_success',
    };
  }

  /**
   * 更新用户组信息
   * @description 更新指定用户组的基本信息、角色分配和用户分配
   * 支持批量更新角色和用户关联关系
   * @param payload 包含租户ID、用户组ID、更新数据和操作者信息的载荷
   * @returns 更新后的用户组信息
   */
  @MessagePattern('iam.group.update')
  async update(@Payload(new ValidationPipe()) payload: UpdateGroupDto) {
    const group = await this.groupService.update(payload);
    return {
      code: ResponseCode.SUCCESS,
      data: group,
      msg: 'iam.group.update_success',
    };
  }

  /**
   * 删除用户组
   * @description 软删除指定用户组，用户组数据不会真正删除，只是标记为已删除状态
   * 删除用户组不会影响组内用户，但会解除用户与组的关联关系
   * @param payload 包含租户ID、用户组ID和操作者信息的载荷
   * @returns 删除操作结果
   */
  @MessagePattern('iam.group.remove')
  async remove(@Payload(new ValidationPipe()) payload: RemoveGroupDto) {
    await this.groupService.remove(payload);
    return {
      code: ResponseCode.SUCCESS,
      msg: 'iam.group.remove_success',
    };
  }

  /**
   * 向用户组添加用户
   * @description 批量向指定用户组添加用户，用户将自动继承组的所有角色权限
   * 如果用户已在组中，则跳过该用户（不会重复添加）
   * @param payload 包含租户ID、用户组ID、用户ID数组和操作者信息的载荷
   * @returns 更新后的用户组信息
   */
  @MessagePattern('iam.group.addUsers')
  async addUsers(
    @Payload(new ValidationPipe())
    payload: AddUsersToGroupDto,
  ) {
    const group = await this.groupService.addUsers(payload);
    return {
      code: ResponseCode.SUCCESS,
      data: group,
      msg: 'iam.group.add_users_success',
    };
  }

  /**
   * 从用户组移除用户
   * @description 批量从指定用户组移除用户，用户将失去通过该组获得的角色权限
   * 如果用户不在组中，则跳过该用户（不会报错）
   * @param payload 包含租户ID、用户组ID、用户ID数组和操作者信息的载荷
   * @returns 更新后的用户组信息
   */
  @MessagePattern('iam.group.removeUsers')
  async removeUsers(
    @Payload(new ValidationPipe())
    payload: RemoveUsersFromGroupDto,
  ) {
    const group = await this.groupService.removeUsers(payload);
    return {
      code: ResponseCode.SUCCESS,
      data: group,
      msg: 'iam.group.remove_users_success',
    };
  }
}
