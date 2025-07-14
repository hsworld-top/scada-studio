/**
 * API网关层面的错误消息常量
 * 这些主要是系统级错误，不需要复杂的i18n
 */
export const ERROR_MESSAGES = {
  SERVICE_UNAVAILABLE: '服务暂时不可用，请稍后重试',
  SSO_SERVICE_UNAVAILABLE: 'SSO服务暂时不可用，请稍后重试',
  TOKEN_REFRESH_SERVICE_UNAVAILABLE: 'Token刷新服务暂时不可用，请稍后重试',
  LOGOUT_SERVICE_UNAVAILABLE: '登出服务暂时不可用，请稍后重试',
  CAPTCHA_SERVICE_UNAVAILABLE: '验证码服务暂时不可用，请稍后重试',
  LOGIN_FAILED: '登录失败，请稍后重试',
  SSO_LOGIN_FAILED: 'SSO登录失败，请稍后重试',
  TOKEN_REFRESH_FAILED: 'Token刷新失败，请稍后重试',
  LOGOUT_FAILED: '登出失败，请稍后重试',
  CAPTCHA_GENERATION_FAILED: '验证码生成失败',
  MISSING_AUTH_TOKEN: '缺少认证token',
} as const;
