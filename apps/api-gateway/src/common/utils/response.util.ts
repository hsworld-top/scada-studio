import {
  ApiResponse,
  ResponseCode,
} from '../interfaces/api-response.interface';

/**
 * 响应工具类
 * 提供便捷的响应格式化方法
 */
export class ResponseUtil {
  /**
   * 创建成功响应
   */
  static success<T>(data?: T, msg: string = '请求成功'): ApiResponse<T> {
    return {
      code: ResponseCode.SUCCESS,
      msg,
      data,
    };
  }

  /**
   * 创建错误响应
   */
  static error(code: number, msg: string, data?: any): ApiResponse {
    return {
      code,
      msg,
      data,
    };
  }

  /**
   * 创建参数错误响应
   */
  static badRequest(msg: string = '参数错误', data?: any): ApiResponse {
    return {
      code: ResponseCode.BAD_REQUEST,
      msg,
      data,
    };
  }

  /**
   * 创建未授权响应
   */
  static unauthorized(msg: string = '未授权', data?: any): ApiResponse {
    return {
      code: ResponseCode.UNAUTHORIZED,
      msg,
      data,
    };
  }

  /**
   * 创建禁止访问响应
   */
  static forbidden(msg: string = '禁止访问', data?: any): ApiResponse {
    return {
      code: ResponseCode.FORBIDDEN,
      msg,
      data,
    };
  }

  /**
   * 创建资源不存在响应
   */
  static notFound(msg: string = '资源不存在', data?: any): ApiResponse {
    return {
      code: ResponseCode.NOT_FOUND,
      msg,
      data,
    };
  }

  /**
   * 创建服务器错误响应
   */
  static serverError(msg: string = '服务器内部错误', data?: any): ApiResponse {
    return {
      code: ResponseCode.INTERNAL_SERVER_ERROR,
      msg,
      data,
    };
  }
}
