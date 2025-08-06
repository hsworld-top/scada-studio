import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PlatformUser } from './platform-user.entity';
import { Repository } from 'typeorm';
import { PasswordUtil, UserStatus } from '@app/shared-dto-lib';
import * as bcrypt from 'bcrypt';

/**
 * PlatformUserService 平台用户服务
 * 负责平台超级管理员的创建、删除、查询、更新等操作
 * 支持服务启动时自动初始化超级管理员账号
 */
@Injectable()
export class PlatformUserService implements OnModuleInit {
  /**
   * 构造函数，注入用户实体的 TypeORM 仓库
   * @param userRepo 平台用户仓库
   */
  constructor(
    @InjectRepository(PlatformUser)
    private readonly userRepo: Repository<PlatformUser>,
  ) {}

  /**
   * 创建超级管理员账号
   * @param username 用户名
   * @param password 明文密码（需满足强度要求）
   * @returns 创建后的用户实体
   * @throws password_not_strong 密码强度不足
   */
  async createAdmin(username: string, password: string) {
    if (!this.isStrongPassword(password)) {
      throw new Error('password_not_strong');
    }
    // 检查是否已存在同名用户
    const existingUser = await this.userRepo.findOne({ where: { username } });
    if (existingUser) {
      throw new Error('username_already_exists');
    }
    // 使用 bcrypt 对密码进行加密存储
    const passwordHash = await bcrypt.hash(password, 10);
    const user = this.userRepo.create({ username, passwordHash });
    return this.userRepo.save(user);
  }

  /**
   * 删除超级管理员账号
   * @param id 目标用户ID
   * @param currentUserId 当前操作用户ID
   * @returns 删除结果
   * @throws user_not_found 未找到用户
   * @throws cannot_delete_self 不能删除自己
   */
  async deleteAdmin(id: string, currentUserId: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new Error('user_not_found');
    }
    if (user.id === currentUserId) {
      throw new Error('cannot_delete_self');
    }
    this.userRepo.delete(id);
  }

  /**
   * 查询所有超级管理员账号
   * @returns 用户实体数组
   */
  async listAdmins() {
    return this.userRepo.find();
  }

  /**
   * 更新超级管理员账号信息
   * @param id 用户ID
   * @param dto 更新数据
   * @returns 更新结果
   */
  async changeAdminPassword(id: string, password: string) {
    if (!this.isStrongPassword(password)) {
      throw new Error('password_not_strong');
    }
    const passwordHash = await bcrypt.hash(password, 10);
    this.userRepo.update(id, { passwordHash });
  }

  /**
   * 服务初始化钩子
   * 启动时自动检查并创建超级管理员账号（仅在用户表为空时）
   * 用户名、密码从环境变量读取，需满足强度要求，密码加密存储
   * @throws 超级管理员用户名或密码未配置/密码强度不足
   */
  async onModuleInit() {
    // 检查是否已有超级管理员
    const count = await this.userRepo.count();
    if (count === 0) {
      const password = process.env.SUPER_ADMIN_PASSWORD;
      const username = process.env.SUPER_ADMIN_USERNAME;
      if (!username || !password) {
        throw new Error('超级管理员用户名或密码未配置');
      }
      if (!this.isStrongPassword(password)) {
        throw new Error('超级管理员密码强度不足');
      }
      // 密码加密存储
      const passwordHash = await bcrypt.hash(password, 10);
      const user = this.userRepo.create({
        username,
        passwordHash,
        status: UserStatus.ACTIVE,
      });
      await this.userRepo.save(user);
    }
  }

  /**
   * 校验密码强度
   * 要求：必须包含大写字母、小写字母、数字、特殊字符，且长度>=8
   * @param password 明文密码
   * @returns 是否满足强度要求
   */
  private isStrongPassword(password: string): boolean {
    return PasswordUtil.checkPasswordStrength(password).isValid;
  }
}
