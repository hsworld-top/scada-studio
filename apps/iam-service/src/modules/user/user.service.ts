import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common'; // 导入 Injectable、NotFoundException 和 ConflictException
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
      throw new ConflictException(`用户名 ${createUserDto.username} 已存在`);
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

    // 保存用户
    const savedUser = await this.userRepository.save(user);

    // 返回用户信息（不含密码）
    const { password, ...result } = savedUser;
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
      const { password, ...result } = user;
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
      throw new NotFoundException(`ID为 ${id} 的用户不存在`);
    }

    // 移除密码字段
    const { password, ...result } = user;
    return result as User;
  }

  /**
   * 更新用户信息
   * @param id 用户ID
   * @param updateUserDto 更新数据
   * @returns 更新后的用户
   */
  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, tenantId: updateUserDto.tenantId },
      relations: ['roles', 'groups'],
    });

    if (!user) {
      throw new NotFoundException(`ID为 ${id} 的用户不存在`);
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
    // if (updateUserDto.preferences) {
    //   user.preferences = {
    //     ...user.preferences,
    //     ...updateUserDto.preferences,
    //   };
    // }

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
    const { password, ...result } = updatedUser;
    return result as User;
  }

  /**
   * 删除用户（软删除）
   * @param tenantId 租户ID
   * @param id 用户ID
   */
  async remove(tenantId: number, id: number): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id, tenantId },
    });

    if (!user) {
      throw new NotFoundException(`ID为 ${id} 的用户不存在`);
    }

    await this.userRepository.softDelete(id);
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

  /**
   * 根据用户名查找用户
   * @param tenantId 租户ID
   * @param username 用户名
   * @returns 用户信息
   */
  async findByUsername(
    tenantId: number,
    username: string,
  ): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { tenantId, username },
      relations: ['roles', 'groups'],
    });

    if (!user) return null;

    // 返回用户信息（不含密码）
    const { password, ...result } = user;
    return result as User;
  }
}
