import { Controller, Post, Body, Put, Delete, UseGuards } from '@nestjs/common';
import { RoleService } from './role.service';
import {
  CreateRoleDto,
  FindRolesDto,
  UpdateRoleDto,
  FindOneRoleDto,
  RemoveRoleDto,
} from '@app/shared-dto-lib';

/**
 * 角色管理控制器
 * @description 处理角色相关的HTTP请求，转发到IAM服务
 */
@Controller('api/iam')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  /**
   * 创建角色
   * @description 在指定租户下创建新角色
   * @param createRoleDto 创建角色信息
   * @returns 创建的角色信息
   */
  @Post()
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.roleService.create(createRoleDto);
  }

  /**
   * 查找所有角色
   * @description 获取指定租户下的所有角色列表
   * @param findRolesDto 查询条件
   * @returns 角色列表
   */
  @Post('find-all')
  findAll(@Body() findRolesDto: FindRolesDto) {
    return this.roleService.findAll(findRolesDto);
  }

  /**
   * 查找单个角色
   * @description 根据角色ID获取角色详细信息
   * @param findOneRoleDto 查询条件
   * @returns 角色详细信息
   */
  @Post('find-one')
  findOne(@Body() findOneRoleDto: FindOneRoleDto) {
    return this.roleService.findOne(findOneRoleDto);
  }

  /**
   * 更新角色
   * @description 更新指定角色的信息
   * @param updateRoleDto 更新角色信息
   * @returns 更新后的角色信息
   */
  @Put()
  update(@Body() updateRoleDto: UpdateRoleDto) {
    return this.roleService.update(updateRoleDto);
  }

  /**
   * 删除角色
   * @description 删除指定角色
   * @param removeRoleDto 删除角色信息
   * @returns 删除结果
   */
  @Delete()
  remove(@Body() removeRoleDto: RemoveRoleDto) {
    return this.roleService.remove(removeRoleDto);
  }
}
