import { Controller, ValidationPipe } from '@nestjs/common'; // 导入 Controller 和 ValidationPipe
import { MessagePattern, Payload } from '@nestjs/microservices'; // 导入 MessagePattern 和 Payload
import { SecurityService } from './security.service'; // 导入 SecurityService
import { SecurityPolicyDto } from '@app/shared-dto-lib'; // 导入 UpdateSecuritySettingsDto
import { AppLogger } from '@app/logger-lib'; // 导入 AppLogger

/**
 * 安全设置管理控制器
 * @description 处理安全设置相关的微服务消息模式，提供租户级别的安全策略管理
 * 包括密码策略、登录限制、会话管理等安全相关配置
 * 每个租户都有独立的安全设置，如果租户没有自定义设置则使用系统默认值
 * 所有操作都基于租户隔离，确保不同租户的安全策略相互独立
 */
@Controller()
export class SecurityController {
  constructor(
    private readonly securityService: SecurityService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext('SecurityController');
  }

  /**
   * 获取租户安全设置
   * @description 获取指定租户的安全设置，如果租户没有自定义设置则返回默认设置
   * 自动创建默认设置确保每个租户都有完整的安全配置
   * @param payload 包含租户ID和操作者信息的载荷
   * @returns 租户的安全设置信息
   */
  @MessagePattern('iam.security.getSettings')
  async getSettings(
    @Payload(new ValidationPipe())
    payload: {
      tenantId: number;
      operatorId?: number; // 操作者ID，用于审计日志
    },
  ) {
    this.logger.log(
      `获取安全设置 - 租户: ${payload.tenantId}, 操作者: ${payload.operatorId}`,
    );

    try {
      const settings = await this.securityService.getSettings(payload.tenantId);

      this.logger.log(
        `安全设置获取成功 - 租户: ${payload.tenantId}, 设置ID: ${settings.id}`,
      );

      return {
        success: true,
        data: settings,
        message: '安全设置获取成功',
      };
    } catch (error) {
      this.logger.error(
        `安全设置获取失败 - 租户: ${payload.tenantId}, 错误: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 更新租户安全设置
   * @description 更新指定租户的安全设置，支持部分更新
   * 包括密码复杂度要求、登录失败限制、会话超时等安全策略
   * 更新后的设置立即生效，影响该租户下所有用户的安全验证
   * @param payload 包含租户ID、更新数据和操作者信息的载荷
   * @returns 更新后的安全设置信息
   */
  @MessagePattern('iam.security.updateSettings')
  async updateSettings(
    @Payload(new ValidationPipe())
    payload: {
      tenantId: number;
      data: SecurityPolicyDto;
      operatorId?: number;
    },
  ) {
    this.logger.log(
      `更新安全设置请求 - 租户: ${payload.tenantId}, 操作者: ${payload.operatorId}`,
    );

    // 记录具体的更新内容（用于审计）
    const updateFields = Object.keys(payload.data);
    this.logger.log(
      `安全设置更新字段 - 租户: ${payload.tenantId}, 字段: [${updateFields.join(', ')}]`,
    );

    try {
      const settings = await this.securityService.updateSettings(
        payload.tenantId,
        payload.data,
      );

      this.logger.log(
        `安全设置更新成功 - 租户: ${payload.tenantId}, 设置ID: ${settings.id}`,
      );

      return {
        success: true,
        data: settings,
        message: '安全设置更新成功',
      };
    } catch (error) {
      this.logger.error(
        `安全设置更新失败 - 租户: ${payload.tenantId}, 错误: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 验证密码强度
   * @description 根据租户的安全策略验证密码是否符合要求
   * 检查密码长度、复杂度要求（大小写字母、数字、特殊字符）
   * 用于用户注册、密码修改等场景的密码强度验证
   * @param payload 包含租户ID、密码和操作者信息的载荷
   * @returns 密码验证结果，包含是否通过和具体的错误信息
   */
  @MessagePattern('iam.security.validatePassword')
  async validatePassword(
    @Payload(new ValidationPipe())
    payload: {
      tenantId: number;
      password: string;
      operatorId?: number;
    },
  ) {
    this.logger.log(
      `密码强度验证 - 租户: ${payload.tenantId}, 操作者: ${payload.operatorId}`,
    );

    try {
      const result = await this.securityService.validatePassword(
        payload.tenantId,
        payload.password,
      );

      if (result.valid) {
        this.logger.log(`密码强度验证通过 - 租户: ${payload.tenantId}`);
      } else {
        this.logger.warn(
          `密码强度验证失败 - 租户: ${payload.tenantId}, 原因: ${result.message}`,
        );
      }

      return {
        success: true,
        data: result,
        message: result.valid ? '密码强度验证通过' : '密码强度验证失败',
      };
    } catch (error) {
      this.logger.error(
        `密码强度验证异常 - 租户: ${payload.tenantId}, 错误: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 重置租户安全设置为默认值
   * @description 将指定租户的安全设置重置为系统默认值
   * 这是一个危险操作，会覆盖租户的所有自定义安全策略
   * 通常用于租户安全设置出现问题时的恢复操作
   * @param payload 包含租户ID和操作者信息的载荷
   * @returns 重置后的安全设置信息
   */
  @MessagePattern('iam.security.resetSettings')
  async resetSettings(
    @Payload(new ValidationPipe())
    payload: {
      tenantId: number;
      operatorId?: number;
    },
  ) {
    this.logger.warn(
      `重置安全设置请求 - 租户: ${payload.tenantId}, 操作者: ${payload.operatorId}`,
    );

    try {
      // 创建默认安全设置数据
      const defaultSettings: SecurityPolicyDto = {
        maxLoginAttempts: 5, // 最大登录尝试次数
        lockoutDurationMinutes: 15, // 锁定持续时间（分钟）
        sessionTimeoutMinutes: 30, // 会话超时时间（分钟）
        enableCaptcha: false, // 启用验证码
      };

      const settings = await this.securityService.updateSettings(
        payload.tenantId,
        defaultSettings,
      );

      this.logger.warn(
        `安全设置重置成功 - 租户: ${payload.tenantId}, 设置ID: ${settings.id}`,
      );

      return {
        success: true,
        data: settings,
        message: '安全设置已重置为默认值',
      };
    } catch (error) {
      this.logger.error(
        `安全设置重置失败 - 租户: ${payload.tenantId}, 错误: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
