import { Injectable } from '@nestjs/common'; // 导入 Injectable、NotFoundException 和 ConflictException
import { InjectRepository } from '@nestjs/typeorm'; // 导入 InjectRepository
import { Repository, In } from 'typeorm'; // 导入 Repository 和 In
import { User } from './entities/user.entity'; // 导入 User 实体
import { Role } from '../role/entities/role.entity';
import { Group } from '../group/entities/group.entity';
import { CreateUserDto, UpdateUserDto, UserStatus } from '@app/shared-dto-lib';
import * as bcrypt from 'bcrypt'; // 导入 bcrypt
import { AppLogger } from '@app/logger-lib';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext('UserService');
  }

  /**
   * 创建新用户
   * @param createUserDto 用户创建DTO
   * @returns 创建的用户（不含密码）
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    // 检查用户名是否已存在
    const existingUser = await this.userRepository.findOne({
      where: {
        tenantId: createUserDto.tenantId,
        username: createUserDto.username,
      },
    });

    if (existingUser) {
      throw new Error('iam.user.username_exists');
    }

    // 创建新用户
    const user = this.userRepository.create({
      ...createUserDto,
    });

    // 如果指定了角色，则关联角色
    if (createUserDto.roleIds && createUserDto.roleIds.length > 0) {
      const roles = await this.roleRepository.find({
        where: {
          id: In(createUserDto.roleIds),
          tenantId: createUserDto.tenantId,
        },
      });
      user.roles = roles;
    }

    // 如果指定了用户组，则关联用户组
    if (createUserDto.groupIds && createUserDto.groupIds.length > 0) {
      const groups = await this.groupRepository.find({
        where: {
          id: In(createUserDto.groupIds),
          tenantId: createUserDto.tenantId,
        },
      });
      user.groups = groups;
    }
    // 如果指定了偏好设置，则更新偏好设置
    if (createUserDto.preferences) {
      user.preferences = createUserDto.preferences;
    }

    // 保存用户
    const savedUser = await this.userRepository.save(user);

    // 返回用户信息（不含密码）
    const { password: _, ...result } = savedUser;
    return result as User;
  }

  /**
   * 查找指定租户下的所有用户
   * @param tenantId 租户ID
   * @returns 用户列表
   */
  async findAll(tenantId: number): Promise<User[]> {
    const users = await this.userRepository.find({
      where: { tenantId },
      relations: ['roles', 'groups'],
    });

    // 移除密码字段
    return users.map((user) => {
      const { password: _, ...result } = user;
      return result as User;
    });
  }

  /**
   * 根据ID查找用户
   * @param tenantId 租户ID
   * @param id 用户ID
   * @returns 用户信息
   */
  async findOne(tenantId: number, id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, tenantId },
      relations: ['roles', 'groups'],
    });

    if (!user) {
      throw new Error(`iam.user.user_not_found:${id}`);
    }

    // 移除密码字段
    const { password: _, ...result } = user;
    return result as User;
  }

  /**
   * 更新用户信息
   * @param id 用户ID
   * @param updateUserDto 更新数据
   * @returns 更新后的用户
   */
  async update(updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: updateUserDto.id, tenantId: updateUserDto.tenantId },
      relations: ['roles', 'groups'],
    });

    if (!user) {
      throw new Error(`iam.user.user_not_found:${updateUserDto.id}`);
    }

    // 更新基本信息
    if (updateUserDto.username) user.username = updateUserDto.username;
    if (updateUserDto.email) user.email = updateUserDto.email;
    if (updateUserDto.phone) user.phone = updateUserDto.phone;
    if (updateUserDto.status) user.status = updateUserDto.status;
    if (updateUserDto.description) user.description = updateUserDto.description;
    if (updateUserDto.allowMultiSession !== undefined) {
      user.allowMultiSession = updateUserDto.allowMultiSession;
    }
    if (updateUserDto.preferences) user.preferences = updateUserDto.preferences;
    // 如果提供了新密码，则更新密码
    if (updateUserDto.password) {
      user.password = updateUserDto.password;
    }

    // 更新角色关联
    if (updateUserDto.roleIds) {
      const roles = await this.roleRepository.find({
        where: {
          id: In(updateUserDto.roleIds),
          tenantId: updateUserDto.tenantId,
        },
      });
      user.roles = roles;
    }

    // 更新用户组关联
    if (updateUserDto.groupIds) {
      const groups = await this.groupRepository.find({
        where: {
          id: In(updateUserDto.groupIds),
          tenantId: updateUserDto.tenantId,
        },
      });
      user.groups = groups;
    }

    // 保存更新
    const updatedUser = await this.userRepository.save(user);

    // 返回用户信息（不含密码）
    const { password: _, ...result } = updatedUser;
    return result as User;
  }

  /**
   * 批量删除用户（软删除）
   * @param ids 用户ID列表
   * @param tenantId 租户ID
   */
  async remove(ids: number[], tenantId: number): Promise<void> {
    const users = await this.userRepository.find({
      where: { id: In(ids), tenantId },
    });
    const foundIds: number[] = [];
    const notFoundIds: number[] = [];
    users.forEach((user) => {
      if (!ids.includes(user.id)) {
        notFoundIds.push(user.id);
      } else {
        foundIds.push(user.id);
      }
    });
    // 删除已存在的用户
    await this.userRepository.softDelete(foundIds);
    // 如果存在不存在的用户，则抛出异常
    if (notFoundIds.length > 0) {
      throw new Error(`iam.user.user_not_found:${notFoundIds.join(',')}`);
    }
  }

  /**
   * 验证用户凭据
   * @param tenantId 租户ID
   * @param username 用户名
   * @param password 密码
   * @returns 验证通过的用户或null
   */
  async validateUser(
    tenantId: number,
    username: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { tenantId, username, status: UserStatus.ACTIVE },
      relations: ['roles', 'groups'],
    });

    if (!user) return null;

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return null;

    // 返回用户信息（不含密码）
    const { password: _, ...result } = user;
    return result as User;
  }
}
