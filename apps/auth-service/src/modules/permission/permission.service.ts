import { Injectable } from '@nestjs/common';
import { CasbinService } from '../casbin/casbin.service';
import { AppLogger } from '@app/logger-lib';
import { SYSTEM_PERMISSIONS } from './permission.constants';
import { UpdatePermissionsDto } from '@app/shared-dto-lib';
import { AuditLogService } from '../audit/audit-log.service';

@Injectable()
export class PermissionService {
  private readonly context = PermissionService.name;

  constructor(
    private readonly casbinService: CasbinService,
    private readonly logger: AppLogger,
    private readonly auditLogService: AuditLogService,
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

    await enforcer.removeFilteredPolicy(0, roleName, String(tenantId));
    this.logger.log(
      `Removed old permissions for role '${roleName}' in tenant '${tenantId}'.`,
    );

    if (permissions && permissions.length > 0) {
      const newPolicies = permissions.map((p) => [
        String(roleName),
        String(tenantId),
        String(p.resource),
        String(p.action),
      ]);
      await enforcer.addPolicies(newPolicies);
      this.logger.log(
        `Added ${newPolicies.length} new permissions for role '${roleName}' in tenant '${tenantId}'.`,
      );
    }

    await enforcer.savePolicy();

    await this.auditLogService.audit({
      userId: updatePermissionsDto.operatorId,
      tenantId: updatePermissionsDto.tenantId,
      action: 'updatePermissions',
      resource: 'role',
      targetId: updatePermissionsDto.roleName,
      detail: { permissions: updatePermissionsDto.permissions },
      result: 'success',
    });
    return { success: true };
  }
}
