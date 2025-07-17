/**
 * API统一响应格式接口
 */
export interface ApiResponse<T = any> {
  /** 错误码，0表示成功 */
  code: number;
  /** 错误信息或成功信息 */
  msg: string;
  /** 返回数据 */
  data?: T;
  /** 错误原因 */
  reason?: string;
}

/**
 * 响应状态码枚举
 */
export enum ResponseCode {
  /** 成功 */
  SUCCESS = 0,
  /** 参数错误 */
  BAD_REQUEST = 400,
  /** 未授权 */
  UNAUTHORIZED = 401,
  /** 禁止访问 */
  FORBIDDEN = 403,
  /** 资源不存在 */
  NOT_FOUND = 404,
  /** 请求过于频繁 */
  TOO_MANY_REQUESTS = 429,
  /** 服务器内部错误 */
  INTERNAL_SERVER_ERROR = 500,
  /** 服务不可用 */
  SERVICE_UNAVAILABLE = 503,
}
