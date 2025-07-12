import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 从微服务 Payload 中提取 currentUserId 字段
 */
export const CurrentUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    // 微服务（MessagePattern）场景
    const payload = ctx.getArgByIndex(1); // 微服务 payload 通常在第二个参数
    return payload?.currentUserId || payload?.operatorId;
  },
);
