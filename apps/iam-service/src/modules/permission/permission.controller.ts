import { Controller, ValidationPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PermissionService, UserPermissionCheckDto, BatchPermissionCheckDto, RolePermissionDto } from './permission.service';
import { IAM_MESSAGE_PATTERNS } from '../../common/constants/iam.constants';

@Controller('permissions')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @MessagePattern(IAM_MESSAGE_PATTERNS.PERMISSION.CHECK)
  async checkPermission(@Payload(new ValidationPipe()) dto: UserPermissionCheckDto) {
    try {
      const result = await this.permissionService.checkPermission(dto);
      return {
        success: true,
        data: { hasPermission: result },
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @MessagePattern(IAM_MESSAGE_PATTERNS.PERMISSION.BATCH_CHECK)
  async batchCheckPermissions(@Payload(new ValidationPipe()) dto: BatchPermissionCheckDto) {
    try {
      const result = await this.permissionService.batchCheckPermissions(dto);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @MessagePattern(IAM_MESSAGE_PATTERNS.PERMISSION.GET_USER_PERMISSIONS)
  async getUserPermissions(@Payload() payload: { userId: string; tenantId: string }) {
    try {
      const result = await this.permissionService.getUserPermissions(
        payload.userId,
        payload.tenantId,
      );
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @MessagePattern(IAM_MESSAGE_PATTERNS.PERMISSION.GET_ROLE_PERMISSIONS)
  async getRolePermissions(@Payload() payload: { roleName: string; tenantId: string }) {
    try {
      const result = await this.permissionService.getRolePermissions(
        payload.roleName,
        payload.tenantId,
      );
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @MessagePattern('iam.permission.updateRolePermissions')
  async updateRolePermissions(@Payload(new ValidationPipe()) dto: RolePermissionDto) {
    try {
      const result = await this.permissionService.updateRolePermissions(dto);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @MessagePattern('iam.permission.getSystemPermissions')
  getSystemPermissions() {
    try {
      const result = this.permissionService.getSystemPermissions();
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @MessagePattern(IAM_MESSAGE_PATTERNS.PERMISSION.SYNC_PERMISSIONS)
  async syncPermissions() {
    try {
      const result = await this.permissionService.syncPermissions();
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @MessagePattern('iam.permission.getStats')
  async getPermissionStats(@Payload() payload: { tenantId: string }) {
    try {
      const result = await this.permissionService.getPermissionStats(payload.tenantId);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}