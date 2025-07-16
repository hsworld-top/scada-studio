import { Controller, UseGuards, ValidationPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PermissionsGuard } from '../../common/guards/permissions/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions/require-permissions.decorator';
import { PermissionService } from './permission.service';
import { UpdatePermissionsDto } from '@app/shared-dto-lib';
import { I18nService } from 'nestjs-i18n';

@Controller('permissions')
@UseGuards(PermissionsGuard)
@RequirePermissions({ resource: 'permission', action: 'manage' })
export class PermissionController {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly i18n: I18nService,
  ) {}

  @MessagePattern('permissions.getSystemPermissions')
  getSystemPermissions(): any {
    try {
      const result = this.permissionService.getSystemPermissions();
      return {
        code: 0,
        msg: this.i18n.t('auth.success'),
        data: result,
      };
    } catch (error) {
      return this.handlePermissionError(error);
    }
  }

  @MessagePattern('permissions.getForRole')
  async getForRole(@Payload() payload: { roleName: string; tenantId: string }) {
    try {
      const result = await this.permissionService.getPermissionsForRole(
        payload.roleName,
        payload.tenantId,
      );
      return {
        code: 0,
        msg: this.i18n.t('auth.success'),
        data: result,
      };
    } catch (error) {
      return this.handlePermissionError(error);
    }
  }

  @MessagePattern('permissions.updateForRole')
  async updateForRole(
    @Payload(new ValidationPipe()) updatePermissionsDto: UpdatePermissionsDto,
  ) {
    try {
      const result =
        await this.permissionService.updatePermissionsForRole(
          updatePermissionsDto,
        );
      return {
        code: 0,
        msg: this.i18n.t('auth.success'),
        data: result,
      };
    } catch (error) {
      return this.handlePermissionError(error);
    }
  }

  /**
   * 统一处理权限相关的错误，返回标准格式
   */
  private handlePermissionError(error: any) {
    const message = error?.message || '';

    // 权限相关错误
    if (
      message.includes('permission_not_found') ||
      message.includes('权限不存在')
    ) {
      return {
        code: 404,
        msg: this.i18n.t('auth.permission_not_found'),
        data: null,
      };
    }

    if (message.includes('role_not_found') || message.includes('角色不存在')) {
      return {
        code: 404,
        msg: this.i18n.t('auth.role_not_found'),
        data: null,
      };
    }

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
