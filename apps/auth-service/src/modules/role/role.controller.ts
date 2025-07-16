import { Controller, UseGuards, ValidationPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PermissionsGuard } from '../../common/guards/permissions/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions/require-permissions.decorator';
import { RoleService } from './role.service';
import {
  CreateRoleDto,
  UpdateRoleDto,
  FindRolesDto,
} from '@app/shared-dto-lib';
import { I18nService } from 'nestjs-i18n';

@Controller('roles')
@UseGuards(PermissionsGuard)
export class RoleController {
  constructor(
    private readonly roleService: RoleService,
    private readonly i18n: I18nService,
  ) {}

  @MessagePattern('roles.create')
  @RequirePermissions({ resource: 'role', action: 'create' })
  async create(@Payload(new ValidationPipe()) createRoleDto: CreateRoleDto) {
    try {
      const result = await this.roleService.create(createRoleDto);
      return {
        code: 0,
        msg: this.i18n.t('auth.success'),
        data: result,
      };
    } catch (error) {
      return this.handleRoleError(error);
    }
  }

  @MessagePattern('roles.findAll')
  @RequirePermissions({ resource: 'role', action: 'read' })
  async findAll(
    @Payload(new ValidationPipe({ transform: true }))
    findRolesDto: FindRolesDto,
  ) {
    try {
      const result = await this.roleService.findAll(findRolesDto);
      return {
        code: 0,
        msg: this.i18n.t('auth.success'),
        data: result,
      };
    } catch (error) {
      return this.handleRoleError(error);
    }
  }

  @MessagePattern('roles.findOne')
  @RequirePermissions({ resource: 'role', action: 'read' })
  async findOne(@Payload() payload: { id: number; tenantId: number }) {
    try {
      const result = await this.roleService.findOne(
        payload.id,
        payload.tenantId,
      );
      return {
        code: 0,
        msg: this.i18n.t('auth.success'),
        data: result,
      };
    } catch (error) {
      return this.handleRoleError(error);
    }
  }

  @MessagePattern('roles.update')
  @RequirePermissions({ resource: 'role', action: 'update' })
  async update(@Payload(new ValidationPipe()) updateRoleDto: UpdateRoleDto) {
    try {
      const result = await this.roleService.update(updateRoleDto);
      return {
        code: 0,
        msg: this.i18n.t('auth.success'),
        data: result,
      };
    } catch (error) {
      return this.handleRoleError(error);
    }
  }

  @MessagePattern('roles.delete')
  @RequirePermissions({ resource: 'role', action: 'delete' })
  async remove(@Payload() payload: { id: number; tenantId: number }) {
    try {
      const result = await this.roleService.remove(
        payload.id,
        payload.tenantId,
      );
      return {
        code: 0,
        msg: this.i18n.t('auth.success'),
        data: result,
      };
    } catch (error) {
      return this.handleRoleError(error);
    }
  }

  /**
   * 统一处理角色相关的错误，返回标准格式
   */
  private handleRoleError(error: any) {
    const message = error?.message || '';

    // 角色相关错误
    if (message.includes('role_not_found') || message.includes('角色不存在')) {
      return {
        code: 404,
        msg: this.i18n.t('auth.role_not_found'),
        data: null,
      };
    }

    if (
      message.includes('role_already_exists') ||
      message.includes('角色已存在')
    ) {
      return {
        code: 409,
        msg: this.i18n.t('auth.role_already_exists'),
        data: null,
      };
    }

    if (
      message.includes('cannot_delete_role') ||
      message.includes('不能删除角色')
    ) {
      return {
        code: 400,
        msg: this.i18n.t('auth.cannot_delete_role'),
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
