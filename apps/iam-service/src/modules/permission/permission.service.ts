import { Injectable } from '@nestjs/common';
import { CasbinService } from '../casbin/casbin.service';
import { AppLogger } from '@app/logger-lib';
import { 
  PERMISSION_ACTIONS, 
  RESOURCE_TYPES,
  ERROR_CODES 
} from '../../common/constants/iam.constants';

export interface PermissionDto {
  resource: string;
  action: string;
}

export interface RolePermissionDto {
  roleName: string;
  tenantId: string;
  permissions: PermissionDto[];
}

export interface UserPermissionCheckDto {
  userId: string;
  tenantId: string;
  resource: string;
  action: string;
}

export interface BatchPermissionCheckDto {
  userId: string;
  tenantId: string;
  permissions: PermissionDto[];
}

@Injectable()
export class PermissionService {
  private readonly context = PermissionService.name;

  constructor(
    private readonly casbinService: CasbinService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(this.context);
  }

  /**
   * 获取系统预定义的权限列表
   */
  getSystemPermissions(): Record<string, string[]> {
    const permissions: Record<string, string[]> = {};
    
    // 为每种资源类型定义可用的操作
    Object.values(RESOURCE_TYPES).forEach(resource => {
      permissions[resource] = Object.values(PERMISSION_ACTIONS);
    });
    
    return permissions;
  }

  /**
   * 检查用户权限
   */
  async checkPermission(dto: UserPermissionCheckDto): Promise<boolean> {
    try {
      const { userId, tenantId, resource, action } = dto;
      
      // 验证资源和操作的有效性
      this.validateResourceAndAction(resource, action);
      
      const hasPermission = await this.casbinService.checkPermission(
        userId.toString(),
        tenantId.toString(),
        resource,
        action,
      );
      
      this.logger.debug(
        `Permission check - User: ${userId}, Tenant: ${tenantId}, Resource: ${resource}, Action: ${action}, Result: ${hasPermission}`
      );
      
      return hasPermission;
    } catch (error) {
      this.logger.error(`Permission check failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 批量检查用户权限
   */
  async batchCheckPermissions(dto: BatchPermissionCheckDto): Promise<Record<string, boolean>> {
    try {
      const { userId, tenantId, permissions } = dto;
      
      // 验证所有权限的有效性
      permissions.forEach(p => this.validateResourceAndAction(p.resource, p.action));
      
      const results = await this.casbinService.batchCheckPermissions(
        userId.toString(),
        tenantId.toString(),
        permissions,
      );
      
      this.logger.debug(
        `Batch permission check - User: ${userId}, Tenant: ${tenantId}, Permissions: ${permissions.length}, Results: ${JSON.stringify(results)}`
      );
      
      return results;
    } catch (error) {
      this.logger.error(`Batch permission check failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 获取角色的权限列表
   */
  async getRolePermissions(roleName: string, tenantId: string): Promise<PermissionDto[]> {
    try {
      const policies = await this.casbinService.getPermissionsForRole(
        roleName,
        tenantId.toString(),
      );
      
      const permissions: PermissionDto[] = policies.map(policy => ({
        resource: policy[2],
        action: policy[3],
      }));
      
      this.logger.debug(
        `Retrieved ${permissions.length} permissions for role ${roleName} in tenant ${tenantId}`
      );
      
      return permissions;
    } catch (error) {
      this.logger.error(`Failed to get role permissions: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 更新角色权限
   */
  async updateRolePermissions(dto: RolePermissionDto): Promise<{ success: boolean }> {
    try {
      const { roleName, tenantId, permissions } = dto;
      
      // 验证所有权限的有效性
      permissions.forEach(p => this.validateResourceAndAction(p.resource, p.action));
      
      // 移除角色的所有现有权限
      await this.casbinService.removeFilteredPolicy(roleName, tenantId.toString());
      
      // 添加新的权限
      if (permissions && permissions.length > 0) {
        const policies: Array<[string, string, string, string]> = permissions.map(p => [
          roleName,
          tenantId.toString(),
          p.resource,
          p.action,
        ]);
        
        await this.casbinService.addPolicies(policies);
      }
      
      // 保存策略到数据库
      await this.casbinService.savePolicy();
      
      this.logger.log(
        `Updated permissions for role ${roleName} in tenant ${tenantId}: ${permissions.length} permissions`
      );
      
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to update role permissions: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 为角色添加权限
   */
  async addPermissionToRole(
    roleName: string,
    tenantId: string,
    resource: string,
    action: string,
  ): Promise<{ success: boolean }> {
    try {
      this.validateResourceAndAction(resource, action);
      
      const result = await this.casbinService.addPolicy(
        roleName,
        tenantId.toString(),
        resource,
        action,
      );
      
      if (result) {
        await this.casbinService.savePolicy();
        this.logger.log(
          `Added permission ${resource}:${action} to role ${roleName} in tenant ${tenantId}`
        );
      }
      
      return { success: result };
    } catch (error) {
      this.logger.error(`Failed to add permission to role: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 从角色移除权限
   */
  async removePermissionFromRole(
    roleName: string,
    tenantId: string,
    resource: string,
    action: string,
  ): Promise<{ success: boolean }> {
    try {
      this.validateResourceAndAction(resource, action);
      
      const result = await this.casbinService.removePolicy(
        roleName,
        tenantId.toString(),
        resource,
        action,
      );
      
      if (result) {
        await this.casbinService.savePolicy();
        this.logger.log(
          `Removed permission ${resource}:${action} from role ${roleName} in tenant ${tenantId}`
        );
      }
      
      return { success: result };
    } catch (error) {
      this.logger.error(`Failed to remove permission from role: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 获取用户的所有权限（通过角色）
   */
  async getUserPermissions(userId: string, tenantId: string): Promise<PermissionDto[]> {
    try {
      const roles = await this.casbinService.getRolesForUser(
        userId.toString(),
        tenantId.toString(),
      );
      
      const allPermissions: PermissionDto[] = [];
      const permissionSet = new Set<string>();
      
      for (const role of roles) {
        const rolePermissions = await this.getRolePermissions(role, tenantId);
        
        rolePermissions.forEach(permission => {
          const key = `${permission.resource}:${permission.action}`;
          if (!permissionSet.has(key)) {
            permissionSet.add(key);
            allPermissions.push(permission);
          }
        });
      }
      
      this.logger.debug(
        `Retrieved ${allPermissions.length} permissions for user ${userId} in tenant ${tenantId}`
      );
      
      return allPermissions;
    } catch (error) {
      this.logger.error(`Failed to get user permissions: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 同步权限策略（重新加载）
   */
  async syncPermissions(): Promise<{ success: boolean }> {
    try {
      await this.casbinService.loadPolicy();
      this.logger.log('Permission policies synchronized successfully');
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to sync permissions: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 验证资源和操作的有效性
   */
  private validateResourceAndAction(resource: string, action: string): void {
    const validResources = Object.values(RESOURCE_TYPES);
    const validActions = Object.values(PERMISSION_ACTIONS);
    
    if (!validResources.includes(resource as any)) {
      throw new Error(`${ERROR_CODES.PERMISSION.INVALID_RESOURCE}: ${resource}`);
    }
    
    if (!validActions.includes(action as any)) {
      throw new Error(`${ERROR_CODES.PERMISSION.INVALID_ACTION}: ${action}`);
    }
  }

  /**
   * 获取权限统计信息
   */
  async getPermissionStats(tenantId: string): Promise<{
    totalRoles: number;
    totalPolicies: number;
    rolePermissionCount: Record<string, number>;
  }> {
    try {
      const enforcer = this.casbinService.getEnforcer();
      
      // 获取租户的所有策略
      const allPolicies = await enforcer.getFilteredPolicy(0, '', tenantId.toString());
      
      // 统计角色和权限
      const rolePermissionCount: Record<string, number> = {};
      const roles = new Set<string>();
      
      allPolicies.forEach(policy => {
        const role = policy[0];
        roles.add(role);
        rolePermissionCount[role] = (rolePermissionCount[role] || 0) + 1;
      });
      
      return {
        totalRoles: roles.size,
        totalPolicies: allPolicies.length,
        rolePermissionCount,
      };
    } catch (error) {
      this.logger.error(`Failed to get permission stats: ${error.message}`, error.stack);
      throw error;
    }
  }
}