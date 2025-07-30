import { Controller, ValidationPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RoleService } from './role.service';
import {
  CreateRoleDto,
  FindRolesDto,
  UpdateRoleDto,
  FindOneRoleDto,
  RemoveRoleDto,
} from '@app/shared-dto-lib';
import { AppLogger } from '@app/logger-lib';
import { ResponseCode } from '@app/api-response-lib';

/**
 * 角色管理控制器
 * @description 处理角色相关的微服务消息模式，提供角色的增删改查功能
 * 角色是权限管理的核心概念，用户通过角色获得相应的权限
 * 所有操作都基于租户隔离，确保不同租户的角色数据相互独立
 */
@Controller()
export class RoleController {
  constructor(
    private readonly roleService: RoleService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext('RoleController');
  }

  /**
   * 创建新角色
   * @description 在指定租户下创建新角色，角色名在租户内必须唯一
   * @param payload 包含租户ID、角色数据和操作者信息的载荷
   * @returns 创建成功的角色信息
   */
  @MessagePattern('iam.role.create')
  async create(@Payload(new ValidationPipe()) payload: CreateRoleDto) {
    const role = await this.roleService.create(payload);
    return {
      code: ResponseCode.SUCCESS,
      data: role,
      msg: 'iam.role.create_success',
    };
  }

  /**
   * 查询角色列表
   * @description 获取指定租户下的所有角色列表
   * @param payload 包含租户ID和操作者信息的载荷
   * @returns 角色列表
   */
  @MessagePattern('iam.role.findAll')
  async findAll(@Payload(new ValidationPipe()) payload: FindRolesDto) {
    const roles = await this.roleService.findAll(payload.tenantId);
    return {
      code: ResponseCode.SUCCESS,
      data: roles,
      msg: 'iam.role.find_all_success',
    };
  }

  /**
   * 根据ID查询单个角色
   * @description 获取指定租户下特定角色的详细信息
   * @param payload 包含租户ID、角色ID和操作者信息的载荷
   * @returns 角色详细信息
   * @throws NotFoundException 当角色不存在时
   */
  @MessagePattern('iam.role.findOne')
  async findOne(@Payload(new ValidationPipe()) payload: FindOneRoleDto) {
    const role = await this.roleService.findOne(payload);
    return {
      code: ResponseCode.SUCCESS,
      data: role,
      msg: 'iam.role.find_one_success',
    };
  }

  /**
   * 更新角色信息
   * @description 更新指定角色的基本信息，如角色名和描述
   * @param payload 包含租户ID、角色ID、更新数据和操作者信息的载荷
   * @returns 更新后的角色信息
   * @throws NotFoundException 当角色不存在时
   * @throws ConflictException 当角色名冲突时
   */
  @MessagePattern('iam.role.update')
  async update(@Payload(new ValidationPipe()) payload: UpdateRoleDto) {
    const role = await this.roleService.update(payload);
    return {
      code: ResponseCode.SUCCESS,
      data: role,
      msg: 'iam.role.update_success',
    };
  }

  /**
   * 删除角色
   * @description 删除指定角色，注意这是硬删除，角色数据将被永久删除
   * 删除前应确保没有用户或用户组关联此角色
   * @param payload 包含租户ID、角色ID和操作者信息的载荷
   * @returns 删除操作结果
   * @throws NotFoundException 当角色不存在时
   * @throws ConflictException 当角色仍被使用时（如果有相关检查）
   */
  @MessagePattern('iam.role.remove')
  async remove(@Payload(new ValidationPipe()) payload: RemoveRoleDto) {
    await this.roleService.remove(payload);
    return {
      code: ResponseCode.SUCCESS,
      msg: 'iam.role.remove_success',
    };
  }
}
