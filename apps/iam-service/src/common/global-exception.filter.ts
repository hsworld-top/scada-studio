import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { AppLogger } from '@app/logger-lib';
import { Observable, throwError } from 'rxjs';

/**
 * 全局异常过滤器
 * @description 
 * 统一处理 IAM 微服务中的所有异常，确保错误响应的一致性
 * 支持 HTTP 异常和 RPC 异常的转换，适配微服务架构
 * 
 * 主要功能：
 * - 异常类型识别和转换
 * - 统一的错误响应格式
 * - 详细的错误日志记录
 * - 敏感信息过滤和保护
 * - 开发/生产环境的差异化处理
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLogger) {
    this.logger.setContext('GlobalExceptionFilter');
  }

  /**
   * 异常捕获和处理主方法
   * @param exception 捕获到的异常对象
   * @param host 执行上下文，包含请求和响应信息
   * @returns 处理后的异常响应
   */
  catch(exception: any, host: ArgumentsHost): Observable<any> {
    const contextType = host.getType();
    
    // 根据上下文类型选择不同的处理策略
    if (contextType === 'rpc') {
      return this.handleRpcException(exception, host);
    } else {
      return this.handleHttpException(exception, host);
    }
  }

  /**
   * 处理 RPC（微服务）异常
   * @param exception 异常对象
   * @param host 执行上下文
   * @returns RPC 异常响应
   */
  private handleRpcException(exception: any, host: ArgumentsHost): Observable<any> {
    let error: any;
    let statusCode: number;
    let message: string;
    let details: any = null;

    // 根据异常类型进行分类处理
    if (exception instanceof HttpException) {
      // HTTP 异常转换为 RPC 异常
      statusCode = exception.getStatus();
      const response = exception.getResponse();
      
      if (typeof response === 'string') {
        message = response;
      } else if (typeof response === 'object' && response !== null) {
        message = (response as any).message || exception.message;
        details = (response as any).details || null;
      } else {
        message = exception.message;
      }
    } else if (exception instanceof RpcException) {
      // 已经是 RPC 异常，直接处理
      const rpcError = exception.getError();
      if (typeof rpcError === 'object' && rpcError !== null) {
        statusCode = (rpcError as any).statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
        message = (rpcError as any).message || '微服务内部错误';
        details = (rpcError as any).details || null;
      } else {
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        message = String(rpcError) || '微服务内部错误';
      }
    } else {
      // 未知异常类型，统一处理为内部服务器错误
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = this.getErrorMessage(exception);
      details = this.getErrorDetails(exception);
    }

    // 构造标准化的错误响应
    error = {
      success: false,
      statusCode,
      message,
      details,
      timestamp: new Date().toISOString(),
      service: 'iam-service',
    };

    // 记录错误日志
    this.logError(exception, error);

    // 返回 RPC 异常
    return throwError(() => new RpcException(error));
  }

  /**
   * 处理 HTTP 异常（如果有 HTTP 端点）
   * @param exception 异常对象
   * @param host 执行上下文
   * @returns HTTP 异常响应
   */
  private handleHttpException(exception: any, host: ArgumentsHost): Observable<any> {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let statusCode: number;
    let message: string;
    let details: any = null;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as any).message || exception.message;
        details = (exceptionResponse as any).details || null;
      } else {
        message = exception.message;
      }
    } else {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = this.getErrorMessage(exception);
      details = this.getErrorDetails(exception);
    }

    // 构造 HTTP 错误响应
    const errorResponse = {
      success: false,
      statusCode,
      message,
      details,
      timestamp: new Date().toISOString(),
      path: request?.url || 'unknown',
      method: request?.method || 'unknown',
      service: 'iam-service',
    };

    // 记录错误日志
    this.logError(exception, errorResponse);

    // 发送 HTTP 响应
    response.status(statusCode).json(errorResponse);

    return throwError(() => exception);
  }

  /**
   * 从异常对象中提取错误消息
   * @param exception 异常对象
   * @returns 错误消息字符串
   */
  private getErrorMessage(exception: any): string {
    if (exception?.message) {
      return exception.message;
    }
    
    if (typeof exception === 'string') {
      return exception;
    }
    
    // 数据库相关错误的特殊处理
    if (exception?.code) {
      switch (exception.code) {
        case '23505': // PostgreSQL 唯一约束违反
          return '数据已存在，请检查唯一性约束';
        case '23503': // PostgreSQL 外键约束违反
          return '关联数据不存在，请检查数据完整性';
        case '23502': // PostgreSQL 非空约束违反
          return '必填字段不能为空';
        case 'ECONNREFUSED':
          return '数据库连接被拒绝';
        case 'ETIMEDOUT':
          return '数据库连接超时';
        default:
          return `数据库错误: ${exception.code}`;
      }
    }
    
    return '服务内部错误';
  }

  /**
   * 从异常对象中提取详细错误信息
   * @param exception 异常对象
   * @returns 错误详情对象
   */
  private getErrorDetails(exception: any): any {
    // 在生产环境中，不返回敏感的错误详情
    if (process.env.NODE_ENV === 'production') {
      return null;
    }

    const details: any = {};

    // 添加异常类型信息
    if (exception?.constructor?.name) {
      details.type = exception.constructor.name;
    }

    // 添加数据库错误详情
    if (exception?.code) {
      details.code = exception.code;
    }

    if (exception?.detail) {
      details.detail = exception.detail;
    }

    if (exception?.constraint) {
      details.constraint = exception.constraint;
    }

    // 添加验证错误详情
    if (exception?.validationErrors) {
      details.validationErrors = exception.validationErrors;
    }

    return Object.keys(details).length > 0 ? details : null;
  }

  /**
   * 记录错误日志
   * @param exception 原始异常对象
   * @param errorResponse 构造的错误响应
   */
  private logError(exception: any, errorResponse: any): void {
    const { statusCode, message, details } = errorResponse;

    // 根据错误级别选择不同的日志方法
    if (statusCode >= 500) {
      // 服务器内部错误，记录为 error 级别
      this.logger.error(
        `服务器内部错误 - 状态码: ${statusCode}, 消息: ${message}`,
        exception?.stack || 'No stack trace available',
        {
          statusCode,
          message,
          details,
          exceptionType: exception?.constructor?.name || 'Unknown',
        }
      );
    } else if (statusCode >= 400) {
      // 客户端错误，记录为 warn 级别
      this.logger.warn(
        `客户端错误 - 状态码: ${statusCode}, 消息: ${message}`,
        {
          statusCode,
          message,
          details,
          exceptionType: exception?.constructor?.name || 'Unknown',
        }
      );
    } else {
      // 其他情况，记录为 info 级别
      this.logger.log(
        `异常处理 - 状态码: ${statusCode}, 消息: ${message}`,
        {
          statusCode,
          message,
          details,
          exceptionType: exception?.constructor?.name || 'Unknown',
        }
      );
    }
  }
}