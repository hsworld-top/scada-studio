import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import {
  CreateRoleDto,
  RemoveRoleDto,
  UpdateRoleDto,
  FindOneRoleDto,
} from '@app/shared-dto-lib';
import { AppLogger } from '@app/logger-lib';
/**
 * 角色服务
 * @description 角色服务是角色管理的核心服务，用于创建、查找、更新和删除角色。
 * 角色服务与角色实体之间存在一对一关系。
 */
@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext('RoleService');
  }

  /**
   * 创建新角色
   * @param tenantId 租户ID
   * @param createRoleDto 角色创建DTO
   * @returns 创建的角色
   */
  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    // 检查角色名是否已存在
    const existingRole = await this.roleRepository.findOne({
      where: { tenantId: createRoleDto.tenantId, name: createRoleDto.name },
    });

    if (existingRole) {
      throw new Error('iam.role.name_already_exists');
    }

    // 创建新角色
    const role = this.roleRepository.create({
      ...createRoleDto,
    });

    return this.roleRepository.save(role);
  }

  /**
   * 查找指定租户下的所有角色
   * @param tenantId 租户ID
   * @returns 角色列表
   */
  async findAll(tenantId: number): Promise<Role[]> {
    return this.roleRepository.find({
      where: { tenantId },
    });
  }

  /**
   * 根据ID查找角色
   * @param tenantId 租户ID
   * @param id 角色ID
   * @returns 角色信息
   */
  async findOne(findOneRoleDto: FindOneRoleDto): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id: findOneRoleDto.id, tenantId: findOneRoleDto.tenantId },
    });

    if (!role) {
      throw new Error('iam.role.not_found');
    }

    return role;
  }

  /**
   * 更新角色信息
   * @param updateRoleDto 更新数据
   * @returns 更新后的角色
   */
  async update(updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id: updateRoleDto.id, tenantId: updateRoleDto.tenantId },
    });

    if (!role) {
      throw new Error('iam.role.not_found');
    }

    // 如果更新角色名，检查是否与其他角色冲突
    if (updateRoleDto.name && updateRoleDto.name !== role.name) {
      const existingRole = await this.roleRepository.findOne({
        where: { tenantId: updateRoleDto.tenantId, name: updateRoleDto.name },
      });

      if (existingRole) {
        throw new Error('iam.role.name_already_exists');
      }
    }

    // 更新角色
    Object.assign(role, updateRoleDto);
    return this.roleRepository.save(role);
  }

  /**
   * 删除角色
   * @param tenantId 租户ID
   * @param id 角色ID
   */
  async remove(removeRoleDto: RemoveRoleDto): Promise<void> {
    const role = await this.roleRepository.findOne({
      where: { id: removeRoleDto.id, tenantId: removeRoleDto.tenantId },
    });

    if (!role) {
      throw new Error('iam.role.not_found');
    }

    await this.roleRepository.remove(role);
  }
}
