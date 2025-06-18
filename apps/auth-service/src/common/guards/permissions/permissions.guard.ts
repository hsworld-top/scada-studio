import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
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
      return true;
    }

    const { user } = context.switchToRpc().getData();

    if (!user || !user.userId) {
      throw new ForbiddenException('User information not found in request.');
    }

    const { resource, action } = requiredPermissions;
    const userId = user.userId.toString();

    const hasPermission = await this.casbinService.checkPermission(
      userId,
      resource,
      action,
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to perform this action.',
      );
    }

    return true;
  }
}
