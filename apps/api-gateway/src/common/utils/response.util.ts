import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import {
  ApiResponse,
  ResponseCode,
} from '../interfaces/api-response.interface';

/**
 * 响应工具类
 * 提供便捷的响应格式化方法，支持i18n国际化
 */
@Injectable()
export class ResponseUtil {
  constructor(private readonly i18n: I18nService) {}

  /**
   * 获取翻译消息的私有方法
   */
  private async getTranslatedMessage(
    msgKey: string,
    lang?: string,
  ): Promise<string> {
    try {
      const translated = await this.i18n.translate(msgKey, { lang });
      return String(translated);
    } catch (error) {
      return msgKey; // 翻译失败时返回键值作为备用
    }
  }

  /**
   * 创建成功响应
   */
  async success<T>(
    data?: T,
    msgKey: string = 'request_success',
    lang?: string,
  ): Promise<ApiResponse<T>> {
    const msg = await this.getTranslatedMessage(msgKey, lang);
    return {
      code: ResponseCode.SUCCESS,
      msg,
      data,
    };
  }

  /**
   * 创建错误响应
   */
  async error(
    code: number,
    msgKey: string,
    lang?: string,
    data?: any,
  ): Promise<ApiResponse> {
    const msg = await this.getTranslatedMessage(msgKey, lang);
    return {
      code,
      msg,
      data,
    };
  }

  /**
   * 创建参数错误响应
   */
  async badRequest(
    msgKey: string = 'bad_request',
    lang?: string,
    data?: any,
  ): Promise<ApiResponse> {
    const msg = await this.getTranslatedMessage(msgKey, lang);
    return {
      code: ResponseCode.BAD_REQUEST,
      msg,
      data,
    };
  }

  /**
   * 创建未授权响应
   */
  async unauthorized(
    msgKey: string = 'unauthorized',
    lang?: string,
    data?: any,
  ): Promise<ApiResponse> {
    const msg = await this.getTranslatedMessage(msgKey, lang);
    return {
      code: ResponseCode.UNAUTHORIZED,
      msg,
      data,
    };
  }

  /**
   * 创建禁止访问响应
   */
  async forbidden(
    msgKey: string = 'forbidden',
    lang?: string,
    data?: any,
  ): Promise<ApiResponse> {
    const msg = await this.getTranslatedMessage(msgKey, lang);
    return {
      code: ResponseCode.FORBIDDEN,
      msg,
      data,
    };
  }

  /**
   * 创建资源不存在响应
   */
  async notFound(
    msgKey: string = 'not_found',
    lang?: string,
    data?: any,
  ): Promise<ApiResponse> {
    const msg = await this.getTranslatedMessage(msgKey, lang);
    return {
      code: ResponseCode.NOT_FOUND,
      msg,
      data,
    };
  }

  /**
   * 创建服务器错误响应
   */
  async serverError(
    msgKey: string = 'internal_server_error',
    lang?: string,
    data?: any,
  ): Promise<ApiResponse> {
    const msg = await this.getTranslatedMessage(msgKey, lang);
    return {
      code: ResponseCode.INTERNAL_SERVER_ERROR,
      msg,
      data,
    };
  }

  /**
   * 静态工具方法：使用翻译后的消息创建成功响应
   */
  static successWithMessage<T>(data?: T, msg?: string): ApiResponse<T> {
    return {
      code: ResponseCode.SUCCESS,
      msg: msg || 'Success',
      data,
    };
  }

  /**
   * 静态工具方法：使用翻译后的消息创建错误响应
   */
  static errorWithMessage(code: number, msg: string, data?: any): ApiResponse {
    return {
      code,
      msg,
      data,
    };
  }
}
