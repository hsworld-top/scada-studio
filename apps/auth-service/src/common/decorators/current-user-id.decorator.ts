import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 从微服务 Payload 或 HTTP 请求中提取 currentUserId 字段
 */
export const CurrentUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    // 支持微服务（MessagePattern）和 HTTP
    if (ctx.getType() === 'rpc') {
      const payload = ctx.getArgByIndex(1); // 微服务 payload 通常在第二个参数
      return payload?.currentUserId || payload?.operatorId;
    }
    // HTTP 场景（如有）
    const request = ctx.switchToHttp().getRequest();
    return request.user?.id;
  },
); 