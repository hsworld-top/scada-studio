/**
 * IAM模块缓存键常量
 */
export const IAM_CACHE_KEYS = {
  PERMISSION_CACHE: 'permission_cache',
  ROLE_CACHE: 'role_cache',
  USER_CACHE: 'user_cache',
  GROUP_CACHE: 'group_cache',
  TENANT_CACHE: 'tenant_cache',
  CAPTCHA_CACHE: 'captcha_cache', // 验证码
  LOGIN_ATTEMPTS_CACHE: 'login_attempts_cache', // 登录尝试次数
  REFRESH_TOKEN_CACHE: 'refresh_token_cache', // 刷新 token
  BLACKLIST_CACHE: 'blacklist_cache', // 黑名单
} as const; 