import { Controller, UseGuards, ValidationPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PermissionsGuard } from '../../common/guards/permissions/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions/require-permissions.decorator';
import { GroupService } from './group.service';
import {
  CreateGroupDto,
  UpdateGroupDto,
  FindGroupsDto,
} from '@app/shared-dto-lib';
import { I18nService } from 'nestjs-i18n';

@Controller('groups')
@UseGuards(PermissionsGuard)
export class GroupController {
  constructor(
    private readonly groupService: GroupService,
    private readonly i18n: I18nService,
  ) {}

  @MessagePattern('groups.create')
  @RequirePermissions({ resource: 'group', action: 'create' })
  async create(@Payload(new ValidationPipe()) createGroupDto: CreateGroupDto) {
    try {
      const result = await this.groupService.create(createGroupDto);
      return {
        code: 0,
        msg: this.i18n.t('auth.success'),
        data: result,
      };
    } catch (error) {
      return this.handleGroupError(error);
    }
  }

  @MessagePattern('groups.findAll')
  @RequirePermissions({ resource: 'group', action: 'read' })
  async findAll(
    @Payload(new ValidationPipe({ transform: true }))
    findGroupsDto: FindGroupsDto,
  ) {
    try {
      const result = await this.groupService.findAll(findGroupsDto);
      return {
        code: 0,
        msg: this.i18n.t('auth.success'),
        data: result,
      };
    } catch (error) {
      return this.handleGroupError(error);
    }
  }

  @MessagePattern('groups.findTree')
  @RequirePermissions({ resource: 'group', action: 'read' })
  async findTree(@Payload() payload: { tenantId: number }) {
    try {
      const result = await this.groupService.findTree(payload.tenantId);
      return {
        code: 0,
        msg: this.i18n.t('auth.success'),
        data: result,
      };
    } catch (error) {
      return this.handleGroupError(error);
    }
  }

  @MessagePattern('groups.findOne')
  @RequirePermissions({ resource: 'group', action: 'read' })
  async findOne(@Payload() payload: { id: number; tenantId: number }) {
    try {
      const result = await this.groupService.findOne(
        payload.id,
        payload.tenantId,
      );
      return {
        code: 0,
        msg: this.i18n.t('auth.success'),
        data: result,
      };
    } catch (error) {
      return this.handleGroupError(error);
    }
  }

  @MessagePattern('groups.update')
  @RequirePermissions({ resource: 'group', action: 'update' })
  async update(@Payload(new ValidationPipe()) updateGroupDto: UpdateGroupDto) {
    try {
      const result = await this.groupService.update(updateGroupDto);
      return {
        code: 0,
        msg: this.i18n.t('auth.success'),
        data: result,
      };
    } catch (error) {
      return this.handleGroupError(error);
    }
  }

  @MessagePattern('groups.delete')
  @RequirePermissions({ resource: 'group', action: 'delete' })
  async remove(@Payload() payload: { id: number; tenantId: number }) {
    try {
      const result = await this.groupService.remove(
        payload.id,
        payload.tenantId,
      );
      return {
        code: 0,
        msg: this.i18n.t('auth.success'),
        data: result,
      };
    } catch (error) {
      return this.handleGroupError(error);
    }
  }

  /**
   * 统一处理组相关的错误，返回标准格式
   */
  private handleGroupError(error: any) {
    const message = error?.message || '';

    // 组相关错误
    if (message.includes('group_not_found') || message.includes('组不存在')) {
      return {
        code: 404,
        msg: this.i18n.t('auth.group_not_found'),
        data: null,
      };
    }

    if (
      message.includes('group_already_exists') ||
      message.includes('组已存在')
    ) {
      return {
        code: 409,
        msg: this.i18n.t('auth.group_already_exists'),
        data: null,
      };
    }

    if (
      message.includes('cannot_delete_group') ||
      message.includes('不能删除组')
    ) {
      return {
        code: 400,
        msg: this.i18n.t('auth.cannot_delete_group'),
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
