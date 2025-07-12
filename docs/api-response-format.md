# API统一响应格式

## 概述

API Gateway现在使用统一的响应格式 `{code, msg, data}`，确保所有API端点返回一致的数据结构。

## 响应格式

所有API响应都遵循以下格式：

```typescript
{
  "code": number,    // 错误码，0表示成功
  "msg": string,     // 响应消息
  "data": any        // 响应数据，可能为null
}
```

## 状态码说明

| Code | 含义           | 说明             |
| ---- | -------------- | ---------------- |
| 0    | 成功           | 请求处理成功     |
| 400  | 参数错误       | 请求参数有误     |
| 401  | 未授权         | 需要身份验证     |
| 403  | 禁止访问       | 权限不足         |
| 404  | 资源不存在     | 请求的资源不存在 |
| 429  | 请求过于频繁   | 触发限流         |
| 500  | 服务器内部错误 | 服务器处理异常   |
| 503  | 服务不可用     | 服务暂时不可用   |

## 使用示例

### 成功响应

```json
{
  "code": 0,
  "msg": "请求成功",
  "data": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com"
  }
}
```

### 错误响应

```json
{
  "code": 401,
  "msg": "JWT验证失败",
  "data": null
}
```

## 开发者工具

### ResponseUtil 工具类

在控制器中可以使用 `ResponseUtil` 工具类来创建标准响应：

```typescript
import { ResponseUtil } from '../common/utils/response.util';

@Get('example')
example() {
  // 成功响应
  return ResponseUtil.success(data, '操作成功');

  // 错误响应
  return ResponseUtil.error(400, '参数错误');

  // 常用错误响应
  return ResponseUtil.badRequest('参数错误');
  return ResponseUtil.unauthorized('未授权');
  return ResponseUtil.forbidden('禁止访问');
  return ResponseUtil.notFound('资源不存在');
  return ResponseUtil.serverError('服务器错误');
}
```

### 自动处理

- **响应拦截器**：自动将普通返回值包装为标准格式
- **异常过滤器**：自动将异常转换为标准错误格式
- **全局应用**：所有API端点都会自动使用统一格式

## 注意事项

1. 如果控制器返回的数据已经是标准格式，拦截器不会重复包装
2. 异常会自动转换为对应的错误码和消息
3. 建议在业务逻辑中使用 `ResponseUtil` 工具类来保持代码一致性
