import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { CreateRoleDto, UpdateRoleDto } from '@app/shared-dto-lib';
import { AppLogger } from '@app/logger-lib';

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
  async create(tenantId: number, createRoleDto: CreateRoleDto): Promise<Role> {
    // 检查角色名是否已存在
    const existingRole = await this.roleRepository.findOne({
      where: { tenantId, name: createRoleDto.name }
    });

    if (existingRole) {
      throw new ConflictException(`角色名 ${createRoleDto.name} 已存在`);
    }

    // 创建新角色
    const role = this.roleRepository.create({
      ...createRoleDto,
      tenantId,
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
  async findOne(tenantId: number, id: number): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id, tenantId },
    });

    if (!role) {
      throw new NotFoundException(`ID为 ${id} 的角色不存在`);
    }

    return role;
  }

  /**
   * 更新角色信息
   * @param tenantId 租户ID
   * @param id 角色ID
   * @param updateRoleDto 更新数据
   * @returns 更新后的角色
   */
  async update(tenantId: number, id: number, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id, tenantId },
    });

    if (!role) {
      throw new NotFoundException(`ID为 ${id} 的角色不存在`);
    }

    // 如果更新角色名，检查是否与其他角色冲突
    if (updateRoleDto.name && updateRoleDto.name !== role.name) {
      const existingRole = await this.roleRepository.findOne({
        where: { tenantId, name: updateRoleDto.name }
      });

      if (existingRole) {
        throw new ConflictException(`角色名 ${updateRoleDto.name} 已存在`);
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
  async remove(tenantId: number, id: number): Promise<void> {
    const role = await this.roleRepository.findOne({
      where: { id, tenantId },
    });

    if (!role) {
      throw new NotFoundException(`ID为 ${id} 的角色不存在`);
    }

    await this.roleRepository.remove(role);
  }
}