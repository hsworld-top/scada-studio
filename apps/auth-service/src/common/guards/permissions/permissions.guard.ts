import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CasbinService } from '../../../modules/casbin/casbin.service';
import { PERMISSIONS_KEY } from '../../decorators/require-permissions/require-permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private casbinService: CasbinService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<{
      resource: string;
      action: string;
    }>(PERMISSIONS_KEY, context.getHandler());

    if (!requiredPermissions) {
      return true; // 没有设置权限要求的接口直接放行
    }

    // 从RPC上下文中获取数据，API Gateway 在调用时应注入 user 对象
    const rpcData = context.switchToRpc().getData();
    const user = rpcData.user;

    // 验证 user 对象和租户信息是否存在
    if (!user || !user.userId || !user.tenantId) {
      throw new UnauthorizedException(
        'User or tenant information not found in request payload.',
      );
    }

    const { resource, action } = requiredPermissions;
    const userId = user.userId.toString();
    const tenantId = user.tenantId.toString();

    // 调用改造后的 CasbinService.checkPermission
    const hasPermission = await this.casbinService.checkPermission(
      userId,
      tenantId,
      resource,
      action,
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `User ${userId} does not have permission to perform action '${action}' on resource '${resource}' in tenant ${tenantId}.`,
      );
    }

    return true;
  }
}
