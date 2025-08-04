import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Group } from './entities/group.entity';
import { User } from '../user/entities/user.entity';
import { Role } from '../role/entities/role.entity';
import {
  CreateGroupDto,
  UpdateGroupDto,
  FindOneGroupDto,
  RemoveGroupDto,
  AddUsersToGroupDto,
  RemoveUsersFromGroupDto,
  AssignRolesToGroupDto,
} from '@app/shared-dto-lib';
import { AppLogger } from '@app/logger-lib';
import { CasbinService } from '../casbin/casbin.service';
/**
 * 用户组服务
 * @description
 * 用户组服务是用户组管理的核心服务，用于创建、查询、更新和删除用户组。
 * 用户组服务与用户、角色、租户等实体之间存在多对多关联关系。
 * 用户组服务与用户、角色、租户等实体之间存在多对多关联关系。
 */
@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly casbinService: CasbinService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext('GroupService');
  }

  /**
   * 创建新用户组
   * @param tenantId 租户ID
   * @param createGroupDto 用户组创建DTO
   * @returns 创建的用户组
   */
  async create(createGroupDto: CreateGroupDto): Promise<Group> {
    // 检查用户组名是否已存在
    const existingGroup = await this.groupRepository.findOne({
      where: { tenantId: createGroupDto.tenantId, name: createGroupDto.name },
    });

    if (existingGroup) {
      throw new Error('iam.group.name_already_exists');
    }

    // 创建新用户组
    const group = this.groupRepository.create({
      ...createGroupDto,
      tenantId: createGroupDto.tenantId,
    });

    return this.groupRepository.save(group);
  }

  /**
   * 查找指定租户下的所有用户组
   * @param tenantId 租户ID
   * @returns 用户组列表
   */
  async findAll(tenantId: number): Promise<Group[]> {
    return this.groupRepository.find({
      where: { tenantId },
    });
  }

  /**
   * 根据ID查找用户组
   * @param tenantId 租户ID
   * @param id 用户组ID
   * @returns 用户组信息
   */
  async findOne(findOneGroupDto: FindOneGroupDto): Promise<Group> {
    const group = await this.groupRepository.findOne({
      where: { id: findOneGroupDto.id },
    });

    if (!group) {
      throw new Error('iam.group.not_found');
    }

    return group;
  }

  /**
   * 更新用户组信息
   * @param tenantId 租户ID
   * @param id 用户组ID
   * @param updateGroupDto 更新数据
   * @returns 更新后的用户组
   */
  async update(updateGroupDto: UpdateGroupDto): Promise<Group> {
    const group = await this.groupRepository.findOne({
      where: { id: updateGroupDto.id },
    });

    if (!group) {
      throw new Error('iam.group.not_found');
    }

    // 如果更新用户组名，检查是否与其他用户组冲突
    if (updateGroupDto.name && updateGroupDto.name !== group.name) {
      const existingGroup = await this.groupRepository.findOne({
        where: { tenantId: updateGroupDto.tenantId, name: updateGroupDto.name },
      });

      if (existingGroup) {
        throw new Error('iam.group.name_already_exists');
      }
    }

    // 更新基本信息
    if (updateGroupDto.name) group.name = updateGroupDto.name;
    if (updateGroupDto.description)
      group.description = updateGroupDto.description;

    return this.groupRepository.save(group);
  }

  /**
   * 删除用户组（软删除）
   * @param tenantId 租户ID
   * @param id 用户组ID
   */
  async remove(removeGroupDto: RemoveGroupDto): Promise<void> {
    const group = await this.groupRepository.findOne({
      where: { id: removeGroupDto.id },
    });

    if (!group) {
      throw new Error('iam.group.not_found');
    }

    await this.groupRepository.softDelete(removeGroupDto.id);
  }

  /**
   * 向用户组添加用户
   * @param tenantId 租户ID
   * @param groupId 用户组ID
   * @param userIds 用户ID数组
   * @returns 更新后的用户组
   */
  async addUsers(addUsersToGroupDto: AddUsersToGroupDto): Promise<Group> {
    const group = await this.groupRepository.findOne({
      where: {
        id: addUsersToGroupDto.groupId,
        tenantId: addUsersToGroupDto.tenantId,
      },
    });

    if (!group) {
      throw new Error('iam.group.not_found');
    }

    const users = await this.userRepository.find({
      where: {
        id: In(addUsersToGroupDto.userIds),
        tenantId: addUsersToGroupDto.tenantId,
      },
    });

    if (!group.users) {
      group.users = [];
    }

    // 添加新用户到组
    group.users = [...group.users, ...users];

    // Casbin添加用户到用户组
    await this.casbinService.addUsersToGroup(
      addUsersToGroupDto.tenantId,
      group.id,
      addUsersToGroupDto.userIds,
    );
    return this.groupRepository.save(group);
  }

  /**
   * 从用户组移除用户
   * @param tenantId 租户ID
   * @param groupId 用户组ID
   * @param userIds 用户ID数组
   * @returns 更新后的用户组
   */
  async removeUsers(
    removeUsersFromGroupDto: RemoveUsersFromGroupDto,
  ): Promise<Group> {
    const group = await this.groupRepository.findOne({
      where: {
        id: removeUsersFromGroupDto.groupId,
        tenantId: removeUsersFromGroupDto.tenantId,
      },
    });

    if (!group) {
      throw new Error('iam.group.not_found');
    }

    if (!group.users) {
      return group;
    }

    // 从组中移除指定用户
    group.users = group.users.filter(
      (user) => !removeUsersFromGroupDto.userIds.includes(user.id),
    );

    // Casbin从用户组移除用户
    await this.casbinService.removeUsersFromGroup(
      removeUsersFromGroupDto.tenantId,
      group.id,
      removeUsersFromGroupDto.userIds,
    );

    return this.groupRepository.save(group);
  }

  /**
   * 获取用户组用户
   * @param tenantId 租户ID
   * @param groupId 用户组ID
   * @returns 用户组用户
   */
  async getUsers(tenantId: number, groupId: number): Promise<User[]> {
    const group = await this.groupRepository.findOne({
      where: {
        id: groupId,
        tenantId: tenantId,
      },
    });

    if (!group) {
      throw new Error('iam.group.not_found');
    }

    return group.users;
  }
  /**
   * 获取用户组角色
   * @param tenantId 租户ID
   * @param groupId 用户组ID
   * @returns 用户组角色
   */
  async getRoles(tenantId: number, groupId: number): Promise<Role[]> {
    const group = await this.groupRepository.findOne({
      where: {
        id: groupId,
        tenantId: tenantId,
      },
    });

    if (!group) {
      throw new Error('iam.group.not_found');
    }

    return group.roles;
  }
  /**
   * 用户组分配角色
   * @param tenantId 租户ID
   * @param groupId 用户组ID
   * @param roleIds 角色ID数组
   * @returns 更新后的用户组
   */
  async assignRoles(
    assignRolesToGroupDto: AssignRolesToGroupDto,
  ): Promise<Group> {
    const group = await this.groupRepository.findOne({
      where: {
        id: assignRolesToGroupDto.groupId,
        tenantId: assignRolesToGroupDto.tenantId,
      },
    });

    if (!group) {
      throw new Error('iam.group.not_found');
    }

    const roles = await this.roleRepository.find({
      where: {
        id: In(assignRolesToGroupDto.roleIds),
        tenantId: assignRolesToGroupDto.tenantId,
      },
    });

    group.roles = [...group.roles, ...roles];
    await this.groupRepository.save(group);

    // Casbin分配角色到用户组（使用角色名称）
    const roleNames = roles.map((role) => role.name);
    await this.casbinService.assignRolesToGroup(
      assignRolesToGroupDto.tenantId,
      group.id,
      roleNames,
    );
    return group;
  }

  /**
   * 从用户组移除角色
   * @param tenantId 租户ID
   * @param groupId 用户组ID
   * @param roleIds 角色ID数组
   * @returns 更新后的用户组
   */
  async removeRoles(
    removeRolesFromGroupDto: AssignRolesToGroupDto,
  ): Promise<Group> {
    const group = await this.groupRepository.findOne({
      where: {
        id: removeRolesFromGroupDto.groupId,
        tenantId: removeRolesFromGroupDto.tenantId,
      },
    });

    if (!group) {
      throw new Error('iam.group.not_found');
    }

    const roles = await this.roleRepository.find({
      where: {
        id: In(removeRolesFromGroupDto.roleIds),
        tenantId: removeRolesFromGroupDto.tenantId,
      },
    });

    // 从用户组中移除指定角色
    group.roles = group.roles.filter(
      (role) => !removeRolesFromGroupDto.roleIds.includes(role.id),
    );
    await this.groupRepository.save(group);

    // Casbin从用户组移除角色（使用角色名称）
    const roleNames = roles.map((role) => role.name);
    await this.casbinService.removeRolesFromGroup(
      removeRolesFromGroupDto.tenantId,
      group.id,
      roleNames,
    );
    return group;
  }
}
