import { Controller, UseGuards, ValidationPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PermissionsGuard } from '../../common/guards/permissions/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions/require-permissions.decorator';
import { PermissionService } from './permission.service';
import { UpdatePermissionsDto } from './dto/update-permissions.dto';

@Controller('permissions')
@UseGuards(PermissionsGuard)
@RequirePermissions({ resource: 'permission', action: 'manage' })
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @MessagePattern('permissions.getSystemPermissions')
  async getSystemPermissions(): Promise<any> {
    return this.permissionService.getSystemPermissions();
  }

  @MessagePattern('permissions.getForRole')
  async getForRole(@Payload() payload: { roleName: string; tenantId: string }) {
    return this.permissionService.getPermissionsForRole(
      payload.roleName,
      payload.tenantId,
    );
  }

  @MessagePattern('permissions.updateForRole')
  async updateForRole(
    @Payload(new ValidationPipe()) updatePermissionsDto: UpdatePermissionsDto,
  ) {
    return this.permissionService.updatePermissionsForRole(
      updatePermissionsDto,
    );
  }
}
