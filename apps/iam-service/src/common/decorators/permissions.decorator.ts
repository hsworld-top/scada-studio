import { SetMetadata } from '@nestjs/common';

import { PERMISSIONS_KEY } from '@app/shared-dto-lib';
/**
 * 权限装饰器
 * @param resource 资源标识 (e.g., 'user', 'group', 'role')
 * @param action 操作标识 (e.g.,'manage', 'create', 'read', 'update', 'delete')
 */
export const Permissions = (resource: string, action: string) =>
  SetMetadata(PERMISSIONS_KEY, { resource, action });
