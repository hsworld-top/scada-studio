import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Group } from './entities/group.entity';
import { Role } from '../role/entities/role.entity';
import { User } from '../user/entities/user.entity';
import { CreateGroupDto, UpdateGroupDto } from '@app/shared-dto-lib';
import { AppLogger } from '@app/logger-lib';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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
  async create(tenantId: number, createGroupDto: CreateGroupDto): Promise<Group> {
    // 检查用户组名是否已存在
    const existingGroup = await this.groupRepository.findOne({
      where: { tenantId, name: createGroupDto.name }
    });

    if (existingGroup) {
      throw new ConflictException(`用户组名 ${createGroupDto.name} 已存在`);
    }

    // 创建新用户组
    const group = this.groupRepository.create({
      ...createGroupDto,
      tenantId,
    });

    // 如果指定了角色，则关联角色
    if (createGroupDto.roleIds && createGroupDto.roleIds.length > 0) {
      const roles = await this.roleRepository.find({
        where: { 
          id: In(createGroupDto.roleIds),
          tenantId 
        }
      });
      group.roles = roles;
    }

    // 如果指定了用户，则关联用户
    if (createGroupDto.userIds && createGroupDto.userIds.length > 0) {
      const users = await this.userRepository.find({
        where: { 
          id: In(createGroupDto.userIds),
          tenantId 
        }
      });
      group.users = users;
    }

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
      relations: ['roles', 'users'],
    });
  }

  /**
   * 根据ID查找用户组
   * @param tenantId 租户ID
   * @param id 用户组ID
   * @returns 用户组信息
   */
  async findOne(tenantId: number, id: number): Promise<Group> {
    const group = await this.groupRepository.findOne({
      where: { id, tenantId },
      relations: ['roles', 'users'],
    });

    if (!group) {
      throw new NotFoundException(`ID为 ${id} 的用户组不存在`);
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
  async update(tenantId: number, id: number, updateGroupDto: UpdateGroupDto): Promise<Group> {
    const group = await this.groupRepository.findOne({
      where: { id, tenantId },
      relations: ['roles', 'users'],
    });

    if (!group) {
      throw new NotFoundException(`ID为 ${id} 的用户组不存在`);
    }

    // 如果更新用户组名，检查是否与其他用户组冲突
    if (updateGroupDto.name && updateGroupDto.name !== group.name) {
      const existingGroup = await this.groupRepository.findOne({
        where: { tenantId, name: updateGroupDto.name }
      });

      if (existingGroup) {
        throw new ConflictException(`用户组名 ${updateGroupDto.name} 已存在`);
      }
    }

    // 更新基本信息
    if (updateGroupDto.name) group.name = updateGroupDto.name;
    if (updateGroupDto.description) group.description = updateGroupDto.description;

    // 更新角色关联
    if (updateGroupDto.roleIds) {
      const roles = await this.roleRepository.find({
        where: { 
          id: In(updateGroupDto.roleIds),
          tenantId 
        }
      });
      group.roles = roles;
    }

    // 更新用户关联
    if (updateGroupDto.userIds) {
      const users = await this.userRepository.find({
        where: { 
          id: In(updateGroupDto.userIds),
          tenantId 
        }
      });
      group.users = users;
    }

    return this.groupRepository.save(group);
  }

  /**
   * 删除用户组（软删除）
   * @param tenantId 租户ID
   * @param id 用户组ID
   */
  async remove(tenantId: number, id: number): Promise<void> {
    const group = await this.groupRepository.findOne({
      where: { id, tenantId },
    });

    if (!group) {
      throw new NotFoundException(`ID为 ${id} 的用户组不存在`);
    }

    await this.groupRepository.softDelete(id);
  }

  /**
   * 向用户组添加用户
   * @param tenantId 租户ID
   * @param groupId 用户组ID
   * @param userIds 用户ID数组
   * @returns 更新后的用户组
   */
  async addUsers(tenantId: number, groupId: number, userIds: number[]): Promise<Group> {
    const group = await this.groupRepository.findOne({
      where: { id: groupId, tenantId },
      relations: ['users'],
    });

    if (!group) {
      throw new NotFoundException(`ID为 ${groupId} 的用户组不存在`);
    }

    const users = await this.userRepository.find({
      where: { 
        id: In(userIds),
        tenantId 
      }
    });

    if (!group.users) {
      group.users = [];
    }

    // 添加新用户到组
    group.users = [...group.users, ...users];
    
    return this.groupRepository.save(group);
  }

  /**
   * 从用户组移除用户
   * @param tenantId 租户ID
   * @param groupId 用户组ID
   * @param userIds 用户ID数组
   * @returns 更新后的用户组
   */
  async removeUsers(tenantId: number, groupId: number, userIds: number[]): Promise<Group> {
    const group = await this.groupRepository.findOne({
      where: { id: groupId, tenantId },
      relations: ['users'],
    });

    if (!group) {
      throw new NotFoundException(`ID为 ${groupId} 的用户组不存在`);
    }

    if (!group.users) {
      return group;
    }

    // 从组中移除指定用户
    group.users = group.users.filter(user => !userIds.includes(user.id));
    
    return this.groupRepository.save(group);
  }
}