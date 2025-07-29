import { ExceptionFilter } from '@nestjs/common';
import { ApiResponse, ResponseCode, ErrorCode } from '@app/api-response-lib';

/**
 * 全局异常过滤器
 * 统一处理应用中的未捕获异常，返回标准化响应结构
 */
export class GlobalExceptionFilter implements ExceptionFilter {
  /**
   * 构造函数，注入国际化服务
   * @param i18n 国际化服务实例
   */
  constructor() {}

  catch(exception: any): ApiResponse<null> {
    console.log(exception);
    const code =
      ErrorCode[exception.message] || ResponseCode.INTERNAL_SERVER_ERROR;

    const responseData: ApiResponse = {
      code,
      msg: exception.message,
      data: null,
    };
    return responseData;
  }
}
