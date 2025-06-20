// /* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  Inject,
  forwardRef,
  NotFoundException,
  OnModuleInit,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserStatus } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { CasbinService } from '../casbin/casbin.service';
import { AppLogger } from '@app/logger-lib';
import { Tenant } from '../tenant/entities/tenant.entity';
import { Group } from './entities/group.entity';
import { FindUsersDto } from './dto/find-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SetUserStatusDto } from './dto/set-user-status.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ConfigService } from '@nestjs/config';
import { nanoid } from 'nanoid';

interface SsoPayload {
  provider: string;
  providerId: string;
  email: string;
  username: string;
  tenantSlug: string;
}

@Injectable()
export class UserService implements OnModuleInit {
  private readonly context = UserService.name;

  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Role) private roleRepository: Repository<Role>,
    @InjectRepository(Group) private groupRepository: Repository<Group>,
    @InjectRepository(Tenant) private tenantRepository: Repository<Tenant>,
    @Inject(forwardRef(() => CasbinService))
    private casbinService: CasbinService,
    private readonly logger: AppLogger,
    private readonly configService: ConfigService,
  ) {
    this.logger.setContext(this.context);
  }

  async onModuleInit() {
    await this.seedDefaultTenant();
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const {
      username,
      password,
      roleNames,
      groupIds,
      tenantId,
      email,
      phone,
      description,
    } = createUserDto;

    const tenant = await this.tenantRepository.findOneBy({ id: tenantId });
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${tenantId} not found.`);
    }

    const orConditions: Array<{
      username?: string;
      email?: string;
      phone?: string;
      tenantId: number;
      description?: string;
    }> = [];
    if (username) orConditions.push({ username, tenantId });
    if (email) orConditions.push({ email, tenantId });
    if (phone) orConditions.push({ phone, tenantId });
    if (description) orConditions.push({ description, tenantId });

    if (orConditions.length > 0) {
      const existingUser = await this.userRepository.findOne({
        where: orConditions,
        withDeleted: true,
      });
      if (existingUser) {
        if (existingUser.username === username) {
          throw new ConflictException(
            `User with username '${username}' already exists in this tenant.`,
          );
        }
        if (email && existingUser.email === email) {
          throw new ConflictException(
            `User with email '${email}' already exists in this tenant.`,
          );
        }
        if (phone && existingUser.phone === phone) {
          throw new ConflictException(
            `User with phone '${phone}' already exists in this tenant.`,
          );
        }
      }
    }

    const roles = await this.roleRepository.find({
      where: { name: In(roleNames), tenantId },
    });
    if (roles.length !== roleNames.length) {
      throw new NotFoundException(
        'One or more roles do not exist in this tenant.',
      );
    }

    let groups: Group[] = [];
    if (groupIds && groupIds.length > 0) {
      groups = await this.groupRepository.find({
        where: { id: In(groupIds), tenantId },
      });
      if (groups.length !== groupIds.length) {
        throw new NotFoundException(
          'One or more groups do not exist in this tenant.',
        );
      }
    }

    const user = this.userRepository.create({
      username,
      password,
      email,
      phone,
      tenantId,
      roles,
      groups,
      description,
    });
    const savedUser = await this.userRepository.save(user);

    for (const role of roles) {
      await this.casbinService.addRoleForUser(
        savedUser.id.toString(),
        role.name,
        tenantId.toString(),
      );
    }
    this.logger.log(
      `Successfully created user: ${username} in tenant ${tenantId}`,
    );
    const { password: _, ...result } = savedUser;
    return result as User;
  }

  async findAll(
    findUsersDto: FindUsersDto,
  ): Promise<{ data: User[]; total: number }> {
    const {
      page = 1,
      pageSize = 10,
      searchKeyword,
      roleNames,
      groupIds,
      status,
      tenantId,
    } = findUsersDto;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'role')
      .leftJoinAndSelect('user.groups', 'group')
      .where('user.tenantId = :tenantId', { tenantId });

    if (searchKeyword) {
      queryBuilder.andWhere(
        '(user.username LIKE :keyword OR user.email LIKE :keyword OR user.phone LIKE :keyword)',
        {
          keyword: `%${searchKeyword}%`,
        },
      );
    }

    if (status) {
      queryBuilder.andWhere('user.status = :status', { status });
    }

    if (roleNames && roleNames.length > 0) {
      queryBuilder.andWhere('role.name IN (:...roleNames)', { roleNames });
    }

    if (groupIds && groupIds.length > 0) {
      queryBuilder.andWhere('group.id IN (:...groupIds)', { groupIds });
    }

    const [data, total] = await queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    const sanitizedData = data.map((user) => {
      const { password: _, ...result } = user;
      return result as User;
    });

    return { data: sanitizedData, total };
  }

  async update(updateUserDto: UpdateUserDto): Promise<User> {
    const {
      userId,
      tenantId,
      email,
      phone,
      status,
      roleNames,
      groupIds,
      description,
    } = updateUserDto;

    const user = await this.userRepository.findOne({
      where: { id: userId, tenantId },
      relations: ['roles', 'groups'],
    });
    if (!user) {
      throw new NotFoundException(
        `User with ID ${userId} not found in this tenant.`,
      );
    }

    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (status) user.status = status;
    if (description !== undefined) user.description = description;

    if (roleNames) {
      const newRoles = await this.roleRepository.find({
        where: { name: In(roleNames), tenantId },
      });
      if (newRoles.length !== roleNames.length) {
        throw new NotFoundException(
          'One or more roles do not exist in this tenant.',
        );
      }
      user.roles = newRoles;
      await this.casbinService
        .getEnforcer()
        .deleteRolesForUser(user.id.toString(), tenantId.toString());
      for (const role of newRoles) {
        await this.casbinService.addRoleForUser(
          user.id.toString(),
          role.name,
          tenantId.toString(),
        );
      }
    }

    if (groupIds) {
      user.groups = await this.groupRepository.find({
        where: { id: In(groupIds), tenantId },
      });
    }

    const updatedUser = await this.userRepository.save(user);
    const { password: _password, ...result } = updatedUser;
    return result as User;
  }

  async setStatus(
    setUserStatusDto: SetUserStatusDto,
  ): Promise<{ success: boolean }> {
    const { userId, tenantId, status } = setUserStatusDto;
    const result = await this.userRepository.update(
      { id: userId, tenantId },
      { status },
    );

    if (result.affected === 0) {
      throw new NotFoundException(
        `User with ID ${userId} not found in this tenant.`,
      );
    }

    return { success: true };
  }

  async remove(
    userId: number,
    tenantId: number,
  ): Promise<{ success: boolean }> {
    const result = await this.userRepository.softDelete({
      id: userId,
      tenantId,
    });

    if (result.affected === 0) {
      throw new NotFoundException(
        `User with ID ${userId} not found in this tenant.`,
      );
    }

    await this.casbinService.getEnforcer().deleteUser(userId.toString());
    this.logger.log(
      `Soft deleted user ${userId} and cleared their casbin policies.`,
    );

    return { success: true };
  }

  async findOneByUsername(
    username: string,
    tenantId: number,
  ): Promise<User | null> {
    return this.userRepository.findOne({
      where: { username, tenantId },
      relations: ['roles', 'tenant'],
    });
  }

  async findOneById(id: number, tenantId: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, tenantId },
      relations: ['roles', 'groups', 'tenant'],
    });
    if (!user) {
      throw new NotFoundException(
        `User with ID ${id} not found in this tenant.`,
      );
    }
    return user;
  }

  async getProfile(
    userId: number,
    tenantId: number,
  ): Promise<
    Omit<User, 'password' | 'hashPasswordOnInsert' | 'hashPasswordOnUpdate'>
  > {
    const user = await this.findOneById(userId, tenantId);
    const { password: _password, ...result } = user;
    return result;
  }

  async updateProfile(
    updateProfileDto: UpdateProfileDto,
  ): Promise<
    Omit<User, 'password' | 'hashPasswordOnInsert' | 'hashPasswordOnUpdate'>
  > {
    const { currentUserId, tenantId, email, phone, preferences } =
      updateProfileDto;

    const user = await this.findOneById(currentUserId, tenantId);

    if (email && email !== user.email) {
      const existing = await this.userRepository.findOneBy({ email, tenantId });
      if (existing) {
        throw new ConflictException(
          `Email '${email}' is already in use in this tenant.`,
        );
      }
      user.email = email;
    }

    if (phone && phone !== user.phone) {
      const existing = await this.userRepository.findOneBy({ phone, tenantId });
      if (existing) {
        throw new ConflictException(
          `Phone number '${phone}' is already in use in this tenant.`,
        );
      }
      user.phone = phone;
    }

    if (preferences) {
      user.preferences = preferences;
    }

    const updatedUser = await this.userRepository.save(user);
    const { password: _password, ...result } = updatedUser;
    return result;
  }

  async changePassword(
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ success: boolean }> {
    const { currentUserId, tenantId, oldPassword, newPassword } =
      changePasswordDto;

    const user = await this.findOneById(currentUserId, tenantId);

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Incorrect old password.');
    }

    user.password = newPassword;
    await this.userRepository.save(user);

    this.logger.log(
      `User ${user.username} (ID: ${user.id}) changed their password.`,
    );

    return { success: true };
  }

  async findOrCreateBySSO(payload: SsoPayload): Promise<User> {
    const { email, username, tenantSlug } = payload;

    const tenant = await this.tenantRepository.findOneBy({ slug: tenantSlug });
    if (!tenant) {
      this.logger.error(
        `SSO failed: Tenant with slug '${tenantSlug}' not found.`,
      );
      throw new NotFoundException(
        `Tenant with slug '${tenantSlug}' not found.`,
      );
    }

    const user = await this.userRepository.findOne({
      where: { email, tenantId: tenant.id },
      relations: ['roles', 'tenant'],
    });

    if (user) {
      if (user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('User account is not active.');
      }
      return user;
    }

    this.logger.log(
      `User with email '${email}' not found. Creating a new user via SSO.`,
    );

    const defaultRoleName = 'developer';
    const defaultRole = await this.roleRepository.findOneBy({
      name: defaultRoleName,
      tenantId: tenant.id,
    });
    if (!defaultRole) {
      this.logger.error(
        `SSO user creation failed: Default role '${defaultRoleName}' not found in tenant ${tenant.id}.`,
      );
      throw new InternalServerErrorException(
        'Default role for new users is not configured.',
      );
    }

    const randomPassword = nanoid();
    const newUser = await this.create({
      username: username,
      password: randomPassword,
      email: email,
      tenantId: tenant.id,
      roleNames: [defaultRoleName],
    });

    return this.findOneById(newUser.id, tenant.id);
  }

  private async seedDefaultTenant() {
    const defaultTenantSlug = 'default';
    let tenant = await this.tenantRepository.findOneBy({
      slug: defaultTenantSlug,
    });

    if (!tenant) {
      this.logger.log('Seeding default tenant...');
      tenant = await this.tenantRepository.save({
        name: 'Default Tenant',
        slug: defaultTenantSlug,
      });
      this.logger.log(`Default tenant seeded with ID: ${tenant.id}`);
    }

    const tenantId = tenant.id;
    const tenantIdStr = tenant.id.toString();

    const rolesToSeed = ['super-admin', 'developer'];
    const existingRolesCount = await this.roleRepository.count({
      where: { tenantId },
    });
    if (existingRolesCount === 0) {
      this.logger.log(`Seeding initial roles for tenant ${tenantId}...`);
      const roleEntities = rolesToSeed.map((name) => ({
        name,
        tenantId,
        description: `The ${name} role`,
      }));
      await this.roleRepository.save(roleEntities);
      this.logger.log('Initial roles seeded.');
    }

    const enforcer = this.casbinService.getEnforcer();
    const initialPolicies = [
      ['super-admin', tenantIdStr, 'all', 'manage'],
      ['super-admin', tenantIdStr, 'user', 'create'],
      ['super-admin', tenantIdStr, 'user', 'read'],
      ['super-admin', tenantIdStr, 'user', 'update'],
      ['super-admin', tenantIdStr, 'user', 'delete'],
      ['super-admin', tenantIdStr, 'user', 'manage_status'],
      ['super-admin', tenantIdStr, 'role', 'create'],
      ['super-admin', tenantIdStr, 'role', 'read'],
      ['super-admin', tenantIdStr, 'role', 'update'],
      ['super-admin', tenantIdStr, 'role', 'delete'],
      ['super-admin', tenantIdStr, 'group', 'create'],
      ['super-admin', tenantIdStr, 'group', 'read'],
      ['super-admin', tenantIdStr, 'group', 'update'],
      ['super-admin', tenantIdStr, 'group', 'delete'],
      ['super-admin', tenantIdStr, 'permission', 'manage'],
      ['developer', tenantIdStr, 'workbench', 'access'],
      ['developer', tenantIdStr, 'project', 'manage'],
    ];
    for (const p of initialPolicies) {
      if (!(await enforcer.hasPolicy(...p))) {
        await enforcer.addPolicy(...p);
      }
    }

    const adminExists = await this.userRepository.findOne({
      where: { username: 'admin', tenantId },
    });
    if (!adminExists) {
      this.logger.log(`Seeding super admin for tenant ${tenantId}...`);
      await this.create({
        username: 'admin',
        password: this.configService.get<string>(
          'ADMIN_PASSWORD',
          'admin_password',
        ),
        roleNames: ['super-admin'],
        tenantId,
      });
      this.logger.log('Super admin seeded.');
    }
  }
}
