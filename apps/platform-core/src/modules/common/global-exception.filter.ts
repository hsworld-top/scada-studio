import { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';
import { ApiResponse, ResponseCode } from './api-response.interface';
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

    const status = exception.getStatus();
    const message = this.i18n.t(exception.message);
    const code =
      exception.getResponse()['code'] || ResponseCode.INTERNAL_SERVER_ERROR;

    const responseData: ApiResponse = {
      code,
      msg: message as string,
      data: null,
    };

    response.status(status).json(responseData);
  }
}
