import { Controller, UseGuards, ValidationPipe } from '@nestjs/common';
import { UserService } from './user.service';
import {
  CreateUserDto,
  FindUsersDto,
  UpdateUserDto,
  SetUserStatusDto,
  UpdateProfileDto,
  ChangePasswordDto,
  SecurityPolicyDto,
  UsernameBlacklistDto,
} from '@app/shared-dto-lib';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PermissionsGuard } from '../../common/guards/permissions/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions/require-permissions.decorator';
import { CurrentUserId } from '../../common/decorators/current-user-id.decorator';
import { I18nService } from 'nestjs-i18n';

/**
 * UserController 负责处理用户相关的微服务请求。
 */
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly i18n: I18nService,
  ) {}

  // --- Admin-only Endpoints ---
  @UseGuards(PermissionsGuard)
  @MessagePattern('users.create')
  @RequirePermissions({ resource: 'user', action: 'create' })
  async create(
    @Payload(new ValidationPipe()) createUserDto: CreateUserDto,
    @CurrentUserId() operatorId: number,
  ) {
    try {
      createUserDto.operatorId = createUserDto.operatorId || operatorId;
      const result = await this.userService.create(createUserDto);
      return {
        code: 0,
        msg: this.i18n.t('auth.success'),
        data: result,
      };
    } catch (error) {
      return this.handleUserError(error);
    }
  }

  @UseGuards(PermissionsGuard)
  @MessagePattern('users.findAll')
  @RequirePermissions({ resource: 'user', action: 'read' })
  async findAll(
    @Payload(new ValidationPipe({ transform: true }))
    findUsersDto: FindUsersDto,
  ) {
    try {
      const result = await this.userService.findAll(findUsersDto);
      return {
        code: 0,
        msg: this.i18n.t('auth.success'),
        data: result,
      };
    } catch (error) {
      return this.handleUserError(error);
    }
  }

  @UseGuards(PermissionsGuard)
  @MessagePattern('users.update')
  @RequirePermissions({ resource: 'user', action: 'update' })
  async update(
    @Payload(new ValidationPipe()) updateUserDto: UpdateUserDto,
    @CurrentUserId() operatorId: number,
  ) {
    try {
      updateUserDto.operatorId = updateUserDto.operatorId || operatorId;
      const result = await this.userService.update(updateUserDto);
      return {
        code: 0,
        msg: this.i18n.t('auth.success'),
        data: result,
      };
    } catch (error) {
      return this.handleUserError(error);
    }
  }

  @UseGuards(PermissionsGuard)
  @MessagePattern('users.setStatus')
  @RequirePermissions({ resource: 'user', action: 'manage_status' })
  async setStatus(
    @Payload(new ValidationPipe()) setUserStatusDto: SetUserStatusDto,
    @CurrentUserId() operatorId: number,
  ) {
    try {
      setUserStatusDto.operatorId = setUserStatusDto.operatorId || operatorId;
      const result = await this.userService.setStatus(setUserStatusDto);
      return {
        code: 0,
        msg: this.i18n.t('auth.success'),
        data: result,
      };
    } catch (error) {
      return this.handleUserError(error);
    }
  }

  @UseGuards(PermissionsGuard)
  @MessagePattern('users.delete')
  @RequirePermissions({ resource: 'user', action: 'delete' })
  async remove(
    @Payload()
    payload: {
      userId: number;
      tenantId: number;
      operatorId?: number;
      currentUserId?: number;
    },
    @CurrentUserId() operatorId: number,
  ) {
    try {
      const result = await this.userService.remove(
        payload.userId,
        payload.tenantId,
        payload.operatorId || operatorId,
      );
      return {
        code: 0,
        msg: this.i18n.t('auth.success'),
        data: result,
      };
    } catch (error) {
      return this.handleUserError(error);
    }
  }

  // --- Self-service Endpoints (for logged-in users) ---

  @MessagePattern('users.getProfile')
  async getProfile(
    @Payload() payload: { currentUserId: number; tenantId: number },
  ) {
    try {
      const result = await this.userService.getProfile(
        payload.currentUserId,
        payload.tenantId,
      );
      return {
        code: 0,
        msg: this.i18n.t('auth.success'),
        data: result,
      };
    } catch (error) {
      return this.handleUserError(error);
    }
  }

  @MessagePattern('users.updateProfile')
  async updateProfile(
    @Payload(new ValidationPipe()) updateProfileDto: UpdateProfileDto,
    @CurrentUserId() operatorId: number,
  ) {
    try {
      updateProfileDto.operatorId = updateProfileDto.operatorId || operatorId;
      const result = await this.userService.updateProfile(updateProfileDto);
      return {
        code: 0,
        msg: this.i18n.t('auth.success'),
        data: result,
      };
    } catch (error) {
      return this.handleUserError(error);
    }
  }

  @MessagePattern('users.changePassword')
  async changePassword(
    @Payload(new ValidationPipe()) changePasswordDto: ChangePasswordDto,
    @CurrentUserId() operatorId: number,
  ) {
    try {
      changePasswordDto.operatorId = changePasswordDto.operatorId || operatorId;
      const result = await this.userService.changePassword(changePasswordDto);
      return {
        code: 0,
        msg: this.i18n.t('auth.success'),
        data: result,
      };
    } catch (error) {
      return this.handleUserError(error);
    }
  }

  @MessagePattern('users.setMultiSession')
  async setMultiSession(
    @Payload(new ValidationPipe())
    payload: { userId: number; allowMultiSession: boolean },
    @CurrentUserId() operatorId: number,
  ) {
    try {
      const result = await this.userService.setMultiSession(
        payload.userId,
        payload.allowMultiSession,
        operatorId,
      );
      return {
        code: 0,
        msg: this.i18n.t('auth.success'),
        data: result,
      };
    } catch (error) {
      return this.handleUserError(error);
    }
  }

  @UseGuards(PermissionsGuard)
  @RequirePermissions({ resource: 'user', action: 'manage_security_policy' })
  @MessagePattern('settings.getSecurityPolicy')
  async getSecurityPolicy(@Payload() payload: { tenantId: number }) {
    try {
      const result = await this.userService.getSecurityPolicy(payload.tenantId);
      return {
        code: 0,
        msg: this.i18n.t('auth.success'),
        data: result,
      };
    } catch (error) {
      return this.handleUserError(error);
    }
  }

  @UseGuards(PermissionsGuard)
  @RequirePermissions({ resource: 'user', action: 'manage_security_policy' })
  @MessagePattern('settings.updateSecurityPolicy')
  async updateSecurityPolicy(
    @Payload() payload: { tenantId: number; dto: SecurityPolicyDto },
  ) {
    try {
      const result = await this.userService.updateSecurityPolicy(
        payload.tenantId,
        payload.dto,
      );
      return {
        code: 0,
        msg: this.i18n.t('auth.success'),
        data: result,
      };
    } catch (error) {
      return this.handleUserError(error);
    }
  }

  @UseGuards(PermissionsGuard)
  @RequirePermissions({ resource: 'user', action: 'manage_username_blacklist' })
  @MessagePattern('settings.listUsernameBlacklist')
  async listUsernameBlacklist(@Payload() payload: { tenantId: number }) {
    try {
      const result = await this.userService.listUsernameBlacklist(
        payload.tenantId,
      );
      return {
        code: 0,
        msg: this.i18n.t('auth.success'),
        data: result,
      };
    } catch (error) {
      return this.handleUserError(error);
    }
  }

  @UseGuards(PermissionsGuard)
  @RequirePermissions({ resource: 'user', action: 'manage_username_blacklist' })
  @MessagePattern('settings.addUsernameBlacklist')
  async addUsernameBlacklist(
    @Payload() payload: { tenantId: number; dto: UsernameBlacklistDto },
  ) {
    try {
      const result = await this.userService.addUsernameBlacklist(
        payload.tenantId,
        payload.dto,
      );
      return {
        code: 0,
        msg: this.i18n.t('auth.success'),
        data: result,
      };
    } catch (error) {
      return this.handleUserError(error);
    }
  }

  @UseGuards(PermissionsGuard)
  @RequirePermissions({ resource: 'user', action: 'manage_username_blacklist' })
  @MessagePattern('settings.removeUsernameBlacklist')
  async removeUsernameBlacklist(
    @Payload() payload: { tenantId: number; dto: UsernameBlacklistDto },
  ) {
    try {
      const result = await this.userService.removeUsernameBlacklist(
        payload.tenantId,
        payload.dto,
      );
      return {
        code: 0,
        msg: this.i18n.t('auth.success'),
        data: result,
      };
    } catch (error) {
      return this.handleUserError(error);
    }
  }

  /**
   * 统一处理用户相关的错误，返回标准格式
   */
  private handleUserError(error: any) {
    const message = error?.message || '';

    // 用户相关错误
    if (message.includes('user_not_found') || message.includes('用户不存在')) {
      return {
        code: 404,
        msg: this.i18n.t('auth.user_not_found'),
        data: null,
      };
    }

    if (
      message.includes('user_already_exists') ||
      message.includes('用户已存在')
    ) {
      return {
        code: 409,
        msg: this.i18n.t('auth.user_already_exists'),
        data: null,
      };
    }

    if (message.includes('invalid_password') || message.includes('密码无效')) {
      return {
        code: 400,
        msg: this.i18n.t('auth.invalid_password'),
        data: null,
      };
    }

    if (
      message.includes('cannot_delete_self') ||
      message.includes('不能删除自己')
    ) {
      return {
        code: 400,
        msg: this.i18n.t('auth.cannot_delete_self'),
        data: null,
      };
    }

    // 权限相关错误
    if (
      message.includes('insufficient_permissions') ||
      message.includes('权限不足')
    ) {
      return {
        code: 403,
        msg: this.i18n.t('auth.insufficient_permissions'),
        data: null,
      };
    }

    // 验证错误
    if (message.includes('validation') || message.includes('验证')) {
      return {
        code: 400,
        msg: message,
        data: null,
      };
    }

    // 默认错误
    return {
      code: 500,
      msg: message || this.i18n.t('auth.service_unavailable'),
      data: null,
    };
  }
}
