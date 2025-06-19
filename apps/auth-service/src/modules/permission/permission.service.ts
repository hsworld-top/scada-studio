import { Injectable } from '@nestjs/common';
import { CasbinService } from '../casbin/casbin.service';
import { AppLogger } from '@app/logger-lib';
import { SYSTEM_PERMISSIONS } from './permission.constants';
import { UpdatePermissionsDto } from './dto/update-permissions.dto';

@Injectable()
export class PermissionService {
  private readonly context = PermissionService.name;

  constructor(
    private readonly casbinService: CasbinService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(this.context);
  }

  getSystemPermissions() {
    return SYSTEM_PERMISSIONS;
  }

  getPermissionsForRole(
    roleName: string,
    tenantId: string,
  ): Promise<string[][]> {
    const enforcer = this.casbinService.getEnforcer();
    return enforcer.getFilteredPolicy(0, roleName, tenantId);
  }

  async updatePermissionsForRole(
    updatePermissionsDto: UpdatePermissionsDto,
  ): Promise<{ success: boolean }> {
    const { roleName, permissions, tenantId } = updatePermissionsDto;
    const enforcer = this.casbinService.getEnforcer();

    await enforcer.removeFilteredPolicy(0, roleName, tenantId);
    this.logger.log(
      `Removed old permissions for role '${roleName}' in tenant '${tenantId}'.`,
    );

    if (permissions && permissions.length > 0) {
      const newPolicies = permissions.map((p) => [
        roleName,
        tenantId,
        p.resource,
        p.action,
      ]);
      await enforcer.addPolicies(newPolicies);
      this.logger.log(
        `Added ${newPolicies.length} new permissions for role '${roleName}' in tenant '${tenantId}'.`,
      );
    }

    await enforcer.savePolicy();

    return { success: true };
  }
}
