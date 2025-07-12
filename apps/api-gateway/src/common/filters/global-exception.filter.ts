import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  ApiResponse,
  ResponseCode,
} from '../interfaces/api-response.interface';

/**
 * 全局异常过滤器
 * 处理所有类型的异常，包括HttpException和其他错误
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '服务器内部错误';
    let code = ResponseCode.INTERNAL_SERVER_ERROR;

    // 如果是HttpException，获取具体的状态码和消息
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      code = this.getResponseCode(status);

      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || responseObj.error || exception.message;

        // 如果是数组消息（如验证错误），取第一个
        if (Array.isArray(message)) {
          message = message[0];
        }
      }
    } else {
      // 对于非HttpException的错误，记录详细信息
      this.logger.error(
        `Unexpected error: ${exception?.message || 'Unknown error'}`,
        exception?.stack,
      );

      // 尝试从错误中提取信息
      if (exception?.message) {
        message = exception.message;
      }
    }

    // 构建统一的错误响应格式
    const errorResponse: ApiResponse = {
      code,
      msg: message,
      data: null,
    };

    // 记录错误日志
    this.logger.error(
      `${status} Error: ${message} - ${request.method} ${request.url}`,
      exception?.stack,
    );

    // 返回错误响应
    response.status(status).json(errorResponse);
  }

  /**
   * 根据HTTP状态码获取对应的响应码
   */
  private getResponseCode(httpStatus: number): number {
    switch (httpStatus) {
      case 400:
        return ResponseCode.BAD_REQUEST;
      case 401:
        return ResponseCode.UNAUTHORIZED;
      case 403:
        return ResponseCode.FORBIDDEN;
      case 404:
        return ResponseCode.NOT_FOUND;
      case 429:
        return ResponseCode.TOO_MANY_REQUESTS;
      case 500:
        return ResponseCode.INTERNAL_SERVER_ERROR;
      case 503:
        return ResponseCode.SERVICE_UNAVAILABLE;
      default:
        return httpStatus;
    }
  }
}
