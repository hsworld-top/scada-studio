import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CasbinService } from '../../modules/casbin/casbin.service';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { AppLogger } from '@app/logger-lib';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private casbinService: CasbinService,
    private logger: AppLogger,
  ) {
    this.logger.setContext('PermissionGuard');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<{
      resource: string;
      action: string;
    }>(PERMISSIONS_KEY, context.getHandler());

    if (!requiredPermissions) {
      return true; // 没有设置权限要求的接口直接放行
    }

    // 从RPC上下文中获取数据
    const rpcData = context.switchToRpc().getData();
    const user = rpcData.user;

    // 验证 user 对象和租户信息是否存在
    if (!user || !user.userId || !user.tenantId) {
      this.logger.warn('Permission check failed: missing user or tenant information');
      throw new UnauthorizedException('用户或租户信息缺失');
    }

    const { resource, action } = requiredPermissions;
    const userId = user.userId.toString();
    const tenantId = user.tenantId.toString();

    try {
      // 调用 CasbinService 检查权限
      const hasPermission = await this.casbinService.checkPermission(
        userId,
        tenantId,
        resource,
        action,
      );

      if (!hasPermission) {
        this.logger.warn(
          `Permission denied - User: ${userId}, Tenant: ${tenantId}, Resource: ${resource}, Action: ${action}`
        );
        throw new ForbiddenException(
          `权限不足：用户 ${userId} 在租户 ${tenantId} 中没有对资源 ${resource} 执行 ${action} 操作的权限`
        );
      }

      this.logger.debug(
        `Permission granted - User: ${userId}, Tenant: ${tenantId}, Resource: ${resource}, Action: ${action}`
      );

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof UnauthorizedException) {
        throw error;
      }
      
      this.logger.error(`Permission check error: ${error.message}`, error.stack);
      throw new ForbiddenException('权限检查失败');
    }
  }
}