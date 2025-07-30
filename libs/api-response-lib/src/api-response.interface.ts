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
}

/**
 * 响应状态码枚举
 */
export enum ResponseCode {
  /** 成功 */
  SUCCESS = 0,
  /** 服务器内部错误 */
  INTERNAL_SERVER_ERROR = 500,
  /** 密码错误 */
  PASSWORD_INCORRECT = 1001,
  /** 账号已被禁用 */
  ACCOUNT_DISABLED = 1002,
  /** 账号已登录 */
  ACCOUNT_ALREADY_LOGGED_IN = 1003,
  /** 无效的会话 */
  INVALID_SESSION = 1004,
  /** 密码不符合强度要求 */
  PASSWORD_NOT_STRONG = 1005,
  /** 用户名已存在 */
  USERNAME_ALREADY_EXISTS = 1006,
  /** 用户不存在 */
  USER_NOT_FOUND = 1007,
  /** 不能删除自己 */
  CANNOT_DELETE_SELF = 1008,
  /** 租户已存在 */
  TENANT_ALREADY_EXISTS = 1009,
  /** 租户不存在 */
  TENANT_NOT_FOUND = 1010,
}
/**
 * 错误码映射
 */
export const ErrorCode: Record<string, number> = {
  password_incorrect: ResponseCode.PASSWORD_INCORRECT,
  account_disabled: ResponseCode.ACCOUNT_DISABLED,
  account_already_logged_in: ResponseCode.ACCOUNT_ALREADY_LOGGED_IN,
  invalid_session: ResponseCode.INVALID_SESSION,
  password_not_strong: ResponseCode.PASSWORD_NOT_STRONG,
  username_already_exists: ResponseCode.USERNAME_ALREADY_EXISTS,
  user_not_found: ResponseCode.USER_NOT_FOUND,
  cannot_delete_self: ResponseCode.CANNOT_DELETE_SELF,
  tenant_already_exists: ResponseCode.TENANT_ALREADY_EXISTS,
  tenant_not_found: ResponseCode.TENANT_NOT_FOUND,
};
