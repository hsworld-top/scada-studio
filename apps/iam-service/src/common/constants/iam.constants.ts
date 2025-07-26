/**
 * IAM 服务常量定义
 * @description 定义 IAM 服务中使用的所有常量，包括消息模式、状态码、配置参数等
 * 统一管理常量有助于维护一致性和避免硬编码
 */

/**
 * 微服务消息模式常量
 * @description 定义所有微服务通信的消息模式，确保消息路由的一致性
 */
export const IAM_MESSAGE_PATTERNS = {
  // ==================== 用户管理相关 ====================
  USER: {
    CREATE: 'iam.user.create',
    FIND_ALL: 'iam.user.findAll',
    FIND_ONE: 'iam.user.findOne',
    UPDATE: 'iam.user.update',
    REMOVE: 'iam.user.remove',
    VALIDATE: 'iam.user.validate',
    FIND_BY_USERNAME: 'iam.user.findByUsername',
    CHANGE_PASSWORD: 'iam.user.changePassword',
    SET_STATUS: 'iam.user.setStatus',
    RESET_PASSWORD: 'iam.user.resetPassword',
    GET_PERMISSIONS: 'iam.user.getPermissions',
  },

  // ==================== 角色管理相关 ====================
  ROLE: {
    CREATE: 'iam.role.create',
    FIND_ALL: 'iam.role.findAll',
    FIND_ONE: 'iam.role.findOne',
    UPDATE: 'iam.role.update',
    REMOVE: 'iam.role.remove',
    ASSIGN_PERMISSIONS: 'iam.role.assignPermissions',
    REMOVE_PERMISSIONS: 'iam.role.removePermissions',
    GET_PERMISSIONS: 'iam.role.getPermissions',
  },

  // ==================== 用户组管理相关 ====================
  GROUP: {
    CREATE: 'iam.group.create',
    FIND_ALL: 'iam.group.findAll',
    FIND_ONE: 'iam.group.findOne',
    UPDATE: 'iam.group.update',
    REMOVE: 'iam.group.remove',
    ADD_USERS: 'iam.group.addUsers',
    REMOVE_USERS: 'iam.group.removeUsers',
    ADD_ROLES: 'iam.group.addRoles',
    REMOVE_ROLES: 'iam.group.removeRoles',
  },

  // ==================== 安全设置相关 ====================
  SECURITY: {
    GET_SETTINGS: 'iam.security.getSettings',
    UPDATE_SETTINGS: 'iam.security.updateSettings',
    VALIDATE_PASSWORD: 'iam.security.validatePassword',
    RESET_SETTINGS: 'iam.security.resetSettings',
    CHECK_LOGIN_ATTEMPTS: 'iam.security.checkLoginAttempts',
    RECORD_LOGIN_ATTEMPT: 'iam.security.recordLoginAttempt',
  },

  // ==================== 权限管理相关 ====================
  PERMISSION: {
    CHECK: 'iam.permission.check',
    BATCH_CHECK: 'iam.permission.batchCheck',
    GET_USER_PERMISSIONS: 'iam.permission.getUserPermissions',
    GET_ROLE_PERMISSIONS: 'iam.permission.getRolePermissions',
    SYNC_PERMISSIONS: 'iam.permission.syncPermissions',
  },

  // ==================== 认证管理相关 ====================
  AUTH: {
    LOGIN: 'iam.auth.login',
    LOGOUT: 'iam.auth.logout',
    REFRESH_TOKEN: 'iam.auth.refreshToken',
    VALIDATE_TOKEN: 'iam.auth.validateToken',
    GENERATE_CAPTCHA: 'iam.auth.generateCaptcha',
    SSO_LOGIN: 'iam.auth.ssoLogin',
    CHECK_LOGIN_ATTEMPTS: 'iam.auth.checkLoginAttempts',
  },

  // ==================== 租户管理相关 ====================
  TENANT: {
    GET_BY_SLUG: 'iam.tenant.getBySlug',
    VALIDATE_STATUS: 'iam.tenant.validateStatus',
    GET_QUOTA: 'iam.tenant.getQuota',
  },
} as const;

/**
 * 用户状态常量
 * @description 定义用户账户的各种状态
 */
export const USER_STATUS = {
  /** 活跃状态 - 用户可以正常登录和使用系统 */
  ACTIVE: 'active',
  /** 非活跃状态 - 用户暂时不能登录，但账户保留 */
  INACTIVE: 'inactive',
  /** 锁定状态 - 用户因安全原因被锁定，需要管理员解锁 */
  LOCKED: 'locked',
  /** 待激活状态 - 新注册用户等待邮箱验证或管理员激活 */
  PENDING: 'pending',
  /** 已删除状态 - 软删除状态，用户数据保留但不可用 */
  DELETED: 'deleted',
} as const;

/**
 * 角色类型常量
 * @description 定义不同类型的角色
 */
export const ROLE_TYPE = {
  /** 系统角色 - 系统预定义的角色，不可删除 */
  SYSTEM: 'system',
  /** 自定义角色 - 租户自定义的角色，可以修改和删除 */
  CUSTOM: 'custom',
  /** 临时角色 - 临时分配的角色，有时效性 */
  TEMPORARY: 'temporary',
} as const;

/**
 * 权限操作常量
 * @description 定义系统中的各种权限操作
 */
export const PERMISSION_ACTIONS = {
  /** 创建操作 */
  CREATE: 'create',
  /** 读取操作 */
  READ: 'read',
  /** 更新操作 */
  UPDATE: 'update',
  /** 删除操作 */
  DELETE: 'delete',
  /** 管理操作 - 包含所有操作权限 */
  MANAGE: 'manage',
  /** 执行操作 - 特殊操作权限 */
  EXECUTE: 'execute',
  /** 审批操作 - 工作流相关 */
  APPROVE: 'approve',
} as const;

/**
 * 资源类型常量
 * @description 定义系统中的各种资源类型
 */
export const RESOURCE_TYPES = {
  /** 用户资源 */
  USER: 'user',
  /** 角色资源 */
  ROLE: 'role',
  /** 用户组资源 */
  GROUP: 'group',
  /** 租户资源 */
  TENANT: 'tenant',
  /** 系统设置资源 */
  SYSTEM: 'system',
  /** 报表资源 */
  REPORT: 'report',
  /** 审计日志资源 */
  AUDIT: 'audit',
} as const;

/**
 * 缓存键前缀常量
 * @description 定义 Redis 缓存中使用的键前缀
 */
export const CACHE_KEYS = {
  /** 用户信息缓存前缀 */
  USER: 'iam:user:',
  /** 用户权限缓存前缀 */
  USER_PERMISSIONS: 'iam:user:permissions:',
  /** 角色信息缓存前缀 */
  ROLE: 'iam:role:',
  /** 角色权限缓存前缀 */
  ROLE_PERMISSIONS: 'iam:role:permissions:',
  /** 用户组信息缓存前缀 */
  GROUP: 'iam:group:',
  /** 安全设置缓存前缀 */
  SECURITY_SETTINGS: 'iam:security:',
  /** 登录尝试记录前缀 */
  LOGIN_ATTEMPTS: 'iam:login:attempts:',
  /** 用户会话前缀 */
  USER_SESSION: 'iam:session:',
  /** 权限检查结果缓存前缀 */
  PERMISSION_CHECK: 'iam:permission:check:',
} as const;

/**
 * 默认配置常量
 * @description 定义系统的默认配置参数
 */
export const DEFAULT_CONFIG = {
  /** 密码相关默认配置 */
  PASSWORD: {
    /** 最小长度 */
    MIN_LENGTH: 8,
    /** 最大长度 */
    MAX_LENGTH: 128,
    /** 默认盐值轮数 */
    SALT_ROUNDS: 12,
    /** 密码历史记录数量 */
    HISTORY_COUNT: 5,
    /** 密码过期天数 */
    EXPIRY_DAYS: 90,
  },

  /** 登录相关默认配置 */
  LOGIN: {
    /** 最大失败尝试次数 */
    MAX_ATTEMPTS: 5,
    /** 锁定持续时间（分钟） */
    LOCKOUT_DURATION: 15,
    /** 会话超时时间（分钟） */
    SESSION_TIMEOUT: 30,
  },

  /** 分页相关默认配置 */
  PAGINATION: {
    /** 默认页大小 */
    DEFAULT_PAGE_SIZE: 20,
    /** 最大页大小 */
    MAX_PAGE_SIZE: 100,
  },

  /** 缓存相关默认配置 */
  CACHE: {
    /** 用户信息缓存时间（秒） */
    USER_TTL: 3600, // 1小时
    /** 权限缓存时间（秒） */
    PERMISSION_TTL: 1800, // 30分钟
    /** 安全设置缓存时间（秒） */
    SECURITY_TTL: 7200, // 2小时
  },
} as const;

/**
 * 错误代码常量
 * @description 定义业务相关的错误代码
 */
export const ERROR_CODES = {
  /** 用户相关错误 */
  USER: {
    NOT_FOUND: 'USER_NOT_FOUND',
    ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
    ACCOUNT_INACTIVE: 'ACCOUNT_INACTIVE',
    PASSWORD_EXPIRED: 'PASSWORD_EXPIRED',
  },

  /** 角色相关错误 */
  ROLE: {
    NOT_FOUND: 'ROLE_NOT_FOUND',
    ALREADY_EXISTS: 'ROLE_ALREADY_EXISTS',
    CANNOT_DELETE_SYSTEM_ROLE: 'CANNOT_DELETE_SYSTEM_ROLE',
    IN_USE: 'ROLE_IN_USE',
  },

  /** 权限相关错误 */
  PERMISSION: {
    DENIED: 'PERMISSION_DENIED',
    INVALID_RESOURCE: 'INVALID_RESOURCE',
    INVALID_ACTION: 'INVALID_ACTION',
  },

  /** 租户相关错误 */
  TENANT: {
    NOT_FOUND: 'TENANT_NOT_FOUND',
    INACTIVE: 'TENANT_INACTIVE',
    QUOTA_EXCEEDED: 'TENANT_QUOTA_EXCEEDED',
  },
} as const;

/**
 * 事件类型常量
 * @description 定义系统中的各种事件类型，用于审计和通知
 */
export const EVENT_TYPES = {
  /** 用户相关事件 */
  USER: {
    CREATED: 'user.created',
    UPDATED: 'user.updated',
    DELETED: 'user.deleted',
    LOGIN: 'user.login',
    LOGOUT: 'user.logout',
    PASSWORD_CHANGED: 'user.password_changed',
    STATUS_CHANGED: 'user.status_changed',
  },

  /** 角色相关事件 */
  ROLE: {
    CREATED: 'role.created',
    UPDATED: 'role.updated',
    DELETED: 'role.deleted',
    ASSIGNED: 'role.assigned',
    REVOKED: 'role.revoked',
  },

  /** 权限相关事件 */
  PERMISSION: {
    GRANTED: 'permission.granted',
    REVOKED: 'permission.revoked',
    CHECKED: 'permission.checked',
  },

  /** 安全相关事件 */
  SECURITY: {
    LOGIN_FAILED: 'security.login_failed',
    ACCOUNT_LOCKED: 'security.account_locked',
    SUSPICIOUS_ACTIVITY: 'security.suspicious_activity',
    SETTINGS_CHANGED: 'security.settings_changed',
  },
} as const;
