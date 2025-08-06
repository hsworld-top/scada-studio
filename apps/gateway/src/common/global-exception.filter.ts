import { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';
import { ApiResponse, ResponseCode } from '@app/shared-dto-lib';
import { I18nService } from 'nestjs-i18n';

/**
 * 全局异常过滤器
 * 统一处理应用中的未捕获异常，返回标准化响应结构
 */
export class GlobalExceptionFilter implements ExceptionFilter {
  /**
   * 构造函数，注入国际化服务
   * @param i18n 国际化服务实例
   */
  constructor(private readonly i18n: I18nService) {}

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    let status = ResponseCode.INTERNAL_SERVER_ERROR;
    console.log(exception.stack);
    // 处理特定的异常类型，并设置响应状态码和消息
    switch (exception.name) {
      case 'TokenExpiredError':
        exception.message = 'token_expired';
        status = ResponseCode.UNAUTHORIZED;
        break;
      case 'JsonWebTokenError':
        exception.message = 'token_invalid';
        status = ResponseCode.UNAUTHORIZED;
        break;
      case 'BadRequestException':
        exception.message = 'bad_request';
        status = ResponseCode.BAD_REQUEST;
        break;
      case 'AggregateError':
        exception.message = 'service_unavailable';
        status = ResponseCode.SERVICE_UNAVAILABLE;
        break;
      default:
        if (exception.status) {
          status = exception.status;
        }
        break;
    }
    // 获取国际化消息并构建响应数据结构
    const message = this.i18n.t(exception.message);
    const code = status;
    const responseData: ApiResponse = {
      code,
      msg: message as string,
      data: null,
    };

    response.status(status).json(responseData);
  }
}
