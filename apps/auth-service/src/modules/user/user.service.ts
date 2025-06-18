import {
  Injectable,
  Inject,
  forwardRef,
  NotFoundException,
  OnModuleInit,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { CasbinService } from '../casbin/casbin.service';
import { AppLogger } from '@app/logger-lib';

/**
 * UserService 提供用户相关的业务逻辑，包括用户创建、查询、初始化等。
 */
@Injectable()
export class UserService implements OnModuleInit {
  /** 日志上下文名 */
  private readonly context = UserService.name;

  /**
   * 构造函数，注入用户、角色仓库，Casbin 权限服务和日志服务。
   */
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Role) private roleRepository: Repository<Role>,
    @Inject(forwardRef(() => CasbinService))
    private casbinService: CasbinService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(this.context);
  }

  /**
   * 模块初始化时自动执行，初始化角色和超级管理员。
   */
  async onModuleInit() {
    await this.seedRoles();
    await this.seedSuperAdmin();
  }

  /**
   * 创建新用户，并为其分配角色和 Casbin 权限。
   * @param createUserDto 创建用户的数据传输对象
   * @returns 创建成功的用户实体
   * @throws ConflictException 用户名已存在
   * @throws NotFoundException 角色不存在
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    const { username, password, roleNames } = createUserDto;

    const existingUser = await this.userRepository.findOne({
      where: { username },
    });
    if (existingUser) {
      throw new ConflictException(
        `User with username '${username}' already exists.`,
      );
    }

    // 查找所有指定的角色
    const roles = await this.roleRepository.find({
      where: { name: In(roleNames) },
    });
    if (roles.length !== roleNames.length) {
      throw new NotFoundException('One or more roles do not exist.');
    }

    // 创建并保存用户
    const user = this.userRepository.create({ username, password, roles });
    const savedUser = await this.userRepository.save(user);

    // 为用户分配 Casbin 权限
    for (const role of roles) {
      await this.casbinService.addRoleForUser(
        savedUser.id.toString(),
        role.name,
      );
    }
    this.logger.log(`Successfully created user: ${username}`);
    return savedUser;
  }

  /**
   * 根据用户名查找用户（包含角色信息）。
   * @param username 用户名
   * @returns 用户实体或 null
   */
  async findOneByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { username },
      relations: ['roles'],
    });
  }

  /**
   * 初始化系统角色（如首次启动时）。
   */
  private async seedRoles() {
    const count = await this.roleRepository.count();
    if (count === 0) {
      this.logger.log('Seeding initial roles...');
      await this.roleRepository.save([
        { name: 'super-admin' },
        { name: 'developer' },
      ]);
      this.logger.log('Initial roles seeded.');
    }
  }

  /**
   * 初始化超级管理员账号（如首次启动时）。
   */
  private async seedSuperAdmin() {
    const adminExists = await this.userRepository.findOne({
      where: { username: 'admin' },
    });
    if (!adminExists) {
      this.logger.log('Seeding super admin...');
      await this.create({
        username: 'admin',
        password: process.env.ADMIN_PASSWORD || 'admin_password',
        roleNames: ['super-admin'],
      });
      this.logger.log('Super admin seeded.');
    }
  }
}
