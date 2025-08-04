import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CasbinService } from '../../modules/casbin/casbin.service';
import { AppLogger } from '@app/logger-lib';
import { PERMISSIONS_KEY } from '@app/shared-dto-lib';
/**
 * Casbin 权限守卫
 */
@Injectable()
export class CasbinGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly casbinService: CasbinService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(CasbinGuard.name);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. 从装饰器获取权限元数据 (resource, action)
    const requiredPermission = this.reflector.get<{
      resource: string;
      action: string;
    }>(PERMISSIONS_KEY, context.getHandler());

    // 如果没有设置 @Permissions 装饰器，则默认放行
    if (!requiredPermission) {
      return true;
    }

    // 2. 从微服务请求的 payload 中获取用户信息
    // **重要假设**: 你的 API Gateway 在验证 JWT 后，会将用户信息注入到微服务的 payload 中。
    // 例如: payload = { ..., user: { id: '...', tenantId: '...' } }
    const payload = context.switchToRpc().getData();
    const user = payload.user;

    if (!user || !user.id || !user.tenantId) {
      // 在微服务中，抛出 RpcException 是最佳实践
      this.logger.warn('User information not found in request payload');
      throw new Error('iam.auth.unauthorized');
    }

    const { id: userId, tenantId } = user;
    const { resource, action } = requiredPermission;

    this.logger.debug(
      `Checking permission for user ${userId} in tenant ${tenantId} for resource ${resource} with action ${action}`,
    );

    // 3. 调用 CasbinService 进行权限校验
    const hasPermission = await this.casbinService.checkPermission(
      String(userId),
      String(tenantId),
      resource,
      action,
    );

    if (!hasPermission) {
      this.logger.warn(
        `Permission denied for user ${userId} in tenant ${tenantId} for resource ${resource} with action ${action}`,
      );
      throw new Error('iam.auth.permission_denied');
    }

    this.logger.debug(
      `Permission granted for user ${userId} in tenant ${tenantId} for resource ${resource} with action ${action}`,
    );

    return true;
  }
}
