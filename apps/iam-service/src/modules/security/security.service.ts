import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SecuritySettings } from './entities/security-settings.entity';
import { SecurityPolicyDto } from '@app/shared-dto-lib';
import { AppLogger } from '@app/logger-lib';

@Injectable()
export class SecurityService {
  constructor(
    @InjectRepository(SecuritySettings)
    private readonly securitySettingsRepository: Repository<SecuritySettings>,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext('SecurityService');
  }

  /**
   * 获取租户的安全设置，如果不存在则创建默认设置
   * @param tenantId 租户ID
   * @returns 安全设置
   */
  async getSettings(tenantId: number): Promise<SecuritySettings> {
    let settings = await this.securitySettingsRepository.findOne({
      where: { tenantId },
    });

    if (!settings) {
      // 创建默认安全设置
      settings = this.securitySettingsRepository.create({ tenantId });
      settings = await this.securitySettingsRepository.save(settings);
    }

    return settings;
  }

  /**
   * 更新租户的安全设置
   * @param tenantId 租户ID
   * @param updateDto 更新数据
   * @returns 更新后的安全设置
   */
  async updateSettings(
    tenantId: number,
    updateDto: SecurityPolicyDto,
  ): Promise<SecuritySettings> {
    let settings = await this.securitySettingsRepository.findOne({
      where: { tenantId },
    });

    if (!settings) {
      // 如果设置不存在，创建新设置
      settings = this.securitySettingsRepository.create({
        tenantId,
        ...updateDto,
      });
    } else {
      // 更新现有设置
      Object.assign(settings, updateDto);
    }

    return this.securitySettingsRepository.save(settings);
  }

  /**
   * 验证密码是否符合安全策略
   * @param tenantId 租户ID
   * @param password 密码
   * @returns 验证结果和错误信息
   */
  async validatePassword(
    tenantId: number,
    password: string,
  ): Promise<{ valid: boolean; message?: string }> {
    const settings = await this.getSettings(tenantId);

    // 检查密码长度
    if (password.length < settings.minPasswordLength) {
      return {
        valid: false,
        message: `密码长度不能少于${settings.minPasswordLength}个字符`,
      };
    }

    // 检查大写字母
    if (settings.requireUppercase && !/[A-Z]/.test(password)) {
      return {
        valid: false,
        message: '密码必须包含至少一个大写字母',
      };
    }

    // 检查小写字母
    if (settings.requireLowercase && !/[a-z]/.test(password)) {
      return {
        valid: false,
        message: '密码必须包含至少一个小写字母',
      };
    }

    // 检查数字
    if (settings.requireNumbers && !/\d/.test(password)) {
      return {
        valid: false,
        message: '密码必须包含至少一个数字',
      };
    }

    // 检查特殊字符
    if (
      settings.requireSpecialChars &&
      !/[!@#$%^&*(),.?":{}|<>]/.test(password)
    ) {
      return {
        valid: false,
        message: '密码必须包含至少一个特殊字符',
      };
    }

    return { valid: true };
  }
}
