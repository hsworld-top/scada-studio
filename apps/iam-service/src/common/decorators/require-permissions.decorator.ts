import { SetMetadata } from '@nestjs/common';

/**
 * 权限元数据的 key，用于在守卫中获取权限信息
 */
export const PERMISSIONS_KEY = 'permissions';

/**
 * RequirePermissions 装饰器，用于为路由处理器设置所需的权限
 * @param permissions 包含资源(resource)和操作(action)的权限对象
 * @example
 *   @RequirePermissions({ resource: 'user', action: 'read' })
 */
export const RequirePermissions = (permissions: {
  resource: string;
  action: string;
}) => SetMetadata(PERMISSIONS_KEY, permissions);