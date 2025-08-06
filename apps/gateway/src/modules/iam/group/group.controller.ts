import { Controller, Post, Body, Put, Delete, UseGuards } from '@nestjs/common';
import { GroupService } from './group.service';
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
 * 用户组管理控制器
 * @description 处理用户组相关的HTTP请求，转发到IAM服务
 */
@Controller('api/iam')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  /**
   * 创建用户组
   * @description 在指定租户下创建新用户组
   * @param createGroupDto 创建用户组信息
   * @returns 创建的用户组信息
   */
  @Post()
  create(@Body() createGroupDto: CreateGroupDto) {
    return this.groupService.create(createGroupDto);
  }

  /**
   * 查找所有用户组
   * @description 获取指定租户下的所有用户组列表
   * @param findGroupsDto 查询条件
   * @returns 用户组列表
   */
  @Post('find-all')
  findAll(@Body() findGroupsDto: FindGroupsDto) {
    return this.groupService.findAll(findGroupsDto);
  }

  /**
   * 查找单个用户组
   * @description 根据用户组ID获取用户组详细信息
   * @param findOneGroupDto 查询条件
   * @returns 用户组详细信息
   */
  @Post('find-one')
  findOne(@Body() findOneGroupDto: FindOneGroupDto) {
    return this.groupService.findOne(findOneGroupDto);
  }

  /**
   * 更新用户组
   * @description 更新指定用户组的信息
   * @param updateGroupDto 更新用户组信息
   * @returns 更新后的用户组信息
   */
  @Put()
  update(@Body() updateGroupDto: UpdateGroupDto) {
    return this.groupService.update(updateGroupDto);
  }

  /**
   * 删除用户组
   * @description 删除指定用户组
   * @param removeGroupDto 删除用户组信息
   * @returns 删除结果
   */
  @Delete()
  remove(@Body() removeGroupDto: RemoveGroupDto) {
    return this.groupService.remove(removeGroupDto);
  }

  /**
   * 向用户组添加用户
   * @description 批量向指定用户组添加用户
   * @param addUsersToGroupDto 添加用户信息
   * @returns 更新后的用户组信息
   */
  @Post('add-users')
  addUsers(@Body() addUsersToGroupDto: AddUsersToGroupDto) {
    return this.groupService.addUsers(addUsersToGroupDto);
  }

  /**
   * 从用户组移除用户
   * @description 批量从指定用户组移除用户
   * @param removeUsersFromGroupDto 移除用户信息
   * @returns 更新后的用户组信息
   */
  @Post('remove-users')
  removeUsers(@Body() removeUsersFromGroupDto: RemoveUsersFromGroupDto) {
    return this.groupService.removeUsers(removeUsersFromGroupDto);
  }
}
