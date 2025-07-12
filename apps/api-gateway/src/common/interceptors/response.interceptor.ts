import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  ApiResponse,
  ResponseCode,
} from '../interfaces/api-response.interface';

/**
 * 响应拦截器
 * 统一处理API返回格式为 {code, msg, data}
 */
@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data) => {
        // 如果返回的数据已经是标准格式，直接返回
        if (
          data &&
          typeof data === 'object' &&
          'code' in data &&
          'msg' in data
        ) {
          return data;
        }

        // 对于健康检查等简单响应，直接包装
        if (typeof data === 'string' || typeof data === 'number') {
          return {
            code: ResponseCode.SUCCESS,
            msg: '请求成功',
            data: data,
          };
        }

        // 对于对象响应，检查是否有success字段
        if (data && typeof data === 'object') {
          if ('success' in data) {
            // 如果有success字段，根据success值决定code和msg
            const success = data.success;
            const message = data.message || (success ? '请求成功' : '请求失败');
            const responseData = data.data || data;

            return {
              code: success ? ResponseCode.SUCCESS : ResponseCode.BAD_REQUEST,
              msg: message,
              data: responseData,
            };
          }
        }

        // 默认包装成功响应
        return {
          code: ResponseCode.SUCCESS,
          msg: '请求成功',
          data: data,
        };
      }),
    );
  }
}
