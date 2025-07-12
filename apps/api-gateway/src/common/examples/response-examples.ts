import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { ResponseUtil } from '../utils/response.util';
import { ApiResponse } from '../interfaces/api-response.interface';

/**
 * 响应格式使用示例
 * 演示如何在控制器中使用统一的响应格式
 */
@Controller('example')
export class ExampleController {
  /**
   * 方式1: 使用 ResponseUtil 工具类（推荐）
   */
  @Get('success')
  getSuccess(): ApiResponse {
    const userData = {
      id: 1,
      username: 'admin',
      email: 'admin@example.com',
    };

    return ResponseUtil.success(userData, '获取用户信息成功');
  }

  /**
   * 方式2: 直接返回数据，由响应拦截器自动包装
   */
  @Get('auto-wrap')
  getAutoWrap() {
    return {
      id: 1,
      username: 'admin',
      email: 'admin@example.com',
    };
  }

  /**
   * 方式3: 返回带有success字段的对象
   */
  @Get('with-success')
  getWithSuccess() {
    return {
      success: true,
      data: { message: '操作成功' },
      message: '请求处理成功',
    };
  }

  /**
   * 方式4: 处理错误情况
   */
  @Post('validate')
  validateData(@Body() body: any): ApiResponse {
    if (!body.name) {
      return ResponseUtil.badRequest('name 字段不能为空');
    }

    if (!body.email) {
      return ResponseUtil.badRequest('email 字段不能为空');
    }

    return ResponseUtil.success(body, '数据验证成功');
  }

  /**
   * 方式5: 抛出异常，由全局异常过滤器处理
   */
  @Get('throw-error')
  throwError() {
    // 这个异常会被全局异常过滤器捕获并格式化
    throw new BadRequestException('这是一个测试异常');
  }

  /**
   * 方式6: 模拟不同类型的错误
   */
  @Get('different-errors/:type')
  getDifferentErrors(@Param('type') type: string): ApiResponse {
    switch (type) {
      case 'bad-request':
        return ResponseUtil.badRequest('请求参数错误');
      case 'unauthorized':
        return ResponseUtil.unauthorized('用户未登录');
      case 'forbidden':
        return ResponseUtil.forbidden('没有权限访问');
      case 'not-found':
        return ResponseUtil.notFound('资源不存在');
      case 'server-error':
        return ResponseUtil.serverError('服务器处理异常');
      default:
        return ResponseUtil.success(null, '未知错误类型');
    }
  }
}

/**
 * 使用说明：
 *
 * 1. 推荐使用 ResponseUtil 工具类创建响应
 * 2. 对于简单的成功响应，可以直接返回数据，响应拦截器会自动包装
 * 3. 对于错误情况，可以返回错误响应或抛出异常
 * 4. 所有响应都会被统一格式化为 {code, msg, data} 格式
 *
 * 响应示例：
 *
 * 成功响应：
 * {
 *   "code": 0,
 *   "msg": "请求成功",
 *   "data": { ... }
 * }
 *
 * 错误响应：
 * {
 *   "code": 400,
 *   "msg": "参数错误",
 *   "data": null
 * }
 */
