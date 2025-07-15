import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { nanoid } from 'nanoid';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import * as svgCaptcha from 'svg-captcha';
import { RedisLibService } from '@app/redis-lib';
import { User } from '../user/entities/user.entity';
import {
  UserStatus,
  TenantStatus,
  LoginDto,
  SsoLoginDto,
} from '@app/shared-dto-lib';
import { AppLogger } from '@app/logger-lib';
import { InjectRepository } from '@nestjs/typeorm';
import { Tenant } from '../tenant/entities/tenant.entity';
import { Repository } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import { AuditLogService } from '../audit/audit-log.service';

/**
 * AuthService 提供认证相关的服务（多租户版，带登录增强和SSO）。
 */
@Injectable()
export class AuthService {
  private readonly LOGIN_ATTEMPTS_KEY_PREFIX = 'login-attempts';
  private readonly CAPTCHA_KEY_PREFIX = 'captcha';
  private readonly REFRESH_TOKEN_KEY_PREFIX = 'refresh-token';

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private redisService: RedisLibService,
    private readonly logger: AppLogger,
    @InjectRepository(Tenant) private tenantRepository: Repository<Tenant>,
    private readonly i18n: I18nService,
    private readonly auditLogService: AuditLogService,
  ) {}

  /**
   * 生成图形验证码。
   * @returns {Promise<{ captchaId: string, svg: string, svgBase64: string, dataUri: string }>} 验证码ID和SVG图像数据
   */
  async generateCaptcha(): Promise<{
    captchaId: string;
    // svg: string;
    // svgBase64: string;
    dataUri: string;
  }> {
    const captcha = svgCaptcha.create({
      size: 4, // 验证码长度
      ignoreChars: '0o1i', // 排除易混淆的字符
      noise: 2, // 干扰线数量
      color: true,
      background: '#f2f2f2',
    });

    const captchaId = nanoid();
    const captchaKey = `${this.CAPTCHA_KEY_PREFIX}:${captchaId}`;
    const captchaTTL = Number(process.env.CAPTCHA_TTL_SECONDS || 300); // 5分钟有效期

    // 将验证码文本（小写）存入 Redis
    await this.redisService.set(
      captchaKey,
      captcha.text.toLowerCase(),
      captchaTTL,
    );

    // // 将SVG内容进行Base64编码，避免JSON转义问题
    const svgBase64 = Buffer.from(captcha.data).toString('base64');

    // 生成data URI格式，可直接用于img标签的src属性
    const dataUri = `data:image/svg+xml;base64,${svgBase64}`;

    return {
      captchaId,
      // svg: captcha.data, // 保留原始SVG以向后兼容
      // svgBase64, // Base64编码的SVG内容
      dataUri, // 可直接用于img标签的data URI
    };
  }

  /**
   * 登录前置校验，包括失败锁定和验证码。
   * @param loginDto 登录数据
   * @throws HttpException 如果校验失败
   */
  async preLoginValidate(loginDto: LoginDto): Promise<void> {
    const { tenantSlug, username, captchaId, captchaText } = loginDto;

    // 1. 检查登录失败锁定
    const maxAttempts = Number(process.env.LOGIN_MAX_ATTEMPTS || 5);
    const attemptsKey = `${this.LOGIN_ATTEMPTS_KEY_PREFIX}:${tenantSlug}:${username}`;
    const attempts = await this.redisService.get(attemptsKey);

    if (attempts && Number(attempts) >= maxAttempts) {
      throw new HttpException(
        'Too many failed login attempts. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // 2. 检查是否需要验证码
    const captchaEnabled = process.env.ENABLE_CAPTCHA === 'true';
    if (captchaEnabled) {
      if (!captchaId || !captchaText) {
        throw new BadRequestException(this.i18n.t('auth.captcha_required'));
      }
      const captchaKey = `${this.CAPTCHA_KEY_PREFIX}:${captchaId}`;
      const storedCaptcha = await this.redisService.get(captchaKey);

      // 无论成功失败，立即删除验证码，防止重复使用
      await this.redisService.del(captchaKey);

      if (!storedCaptcha || storedCaptcha !== captchaText.toLowerCase()) {
        throw new BadRequestException(this.i18n.t('auth.invalid_captcha'));
      }
    }
  }

  /**
   * 记录登录尝试（成功或失败）。
   * @param loginDto 登录数据
   * @param success 是否成功
   */
  async recordLoginAttempt(
    loginDto: LoginDto,
    success: boolean,
  ): Promise<void> {
    const { tenantSlug, username } = loginDto;
    const attemptsKey = `${this.LOGIN_ATTEMPTS_KEY_PREFIX}:${tenantSlug}:${username}`;

    if (success) {
      // 登录成功，清除失败计数
      await this.redisService.del(attemptsKey);
    } else {
      // 登录失败，增加失败计数
      const lockDuration = Number(
        process.env.LOGIN_LOCK_DURATION_SECONDS || 900,
      ); // 15分钟
      const newCount = await this.redisService.client.incr(attemptsKey);
      if (newCount === 1) {
        // 第一次失败，设置过期时间
        await this.redisService.client.expire(attemptsKey, lockDuration);
      }
    }
  }

  /**
   * 校验用户身份，用户名和密码是否匹配（多租户版）。
   * @param tenantSlug 租户 slug
   * @param username 用户名
   * @param pass 密码
   * @returns 匹配成功返回用户信息，否则返回 null
   */
  async validateUser(
    tenantSlug: string,
    username: string,
    pass: string,
  ): Promise<Partial<User> | null> {
    // 1. 查找租户
    const tenant = await this.tenantRepository.findOneBy({ slug: tenantSlug });
    if (!tenant) {
      this.logger.warn(`Login attempt for non-existent tenant: ${tenantSlug}`);
      throw new UnauthorizedException(this.i18n.t('auth.tenant_not_found'));
    }
    if (tenant.status !== TenantStatus.ACTIVE) {
      this.logger.warn(
        `Login attempt for inactive tenant: ${tenant.name} (${tenant.slug})`,
      );
      throw new UnauthorizedException(this.i18n.t('auth.tenant_inactive'));
    }

    // 2. 在指定租户下查找用户
    const user = await this.userService.findOneByUsername(username, tenant.id);
    if (!user) {
      throw new UnauthorizedException(this.i18n.t('auth.user_not_found'));
    }

    // 3. 检查用户状态
    if (user.status !== UserStatus.ACTIVE) {
      this.logger.warn(
        `Login attempt for inactive user: ${username} in tenant ${tenant.name}`,
      );
      throw new UnauthorizedException(this.i18n.t('auth.user_inactive'));
    }

    // 4. 校验密码
    if (await bcrypt.compare(pass, user.password)) {
      // 移除敏感信息
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  /**
   * 用户登录，生成包含 tenantId 的 JWT token。
   * 管理员单点登录，普通用户多端登录。
   * @param user 用户信息
   * @returns 包含 access_token、refresh_token、sessionId（普通用户） 的对象
   */
  async login(user: Partial<User>, ip?: string) {
    // 判断是否为管理员（通过角色名 'admin'）
    const isAdmin = user.roles?.some((role) => role.name === 'admin');
    // 普通用户多端登录，生成唯一 sessionId
    let sessionId: string | undefined = undefined;
    if (!isAdmin) {
      sessionId = nanoid(); // nanoid 生成唯一 sessionId
    }
    // 生成 token，普通用户 payload 带 sessionId
    const tokens = await this._generateTokens(user, sessionId);
    // 存储 refresh token，管理员单点登录覆盖写入，普通用户多端写入
    await this._storeRefreshToken(
      user.id!,
      tokens.refreshToken,
      !!isAdmin,
      sessionId,
    );
    // 自动审计
    await this.auditLogService.audit({
      userId: user.id,
      tenantId: user.tenantId,
      action: 'login',
      resource: 'user',
      targetId: user.id?.toString(),
      result: 'success',
      ip,
      detail: { username: user.username },
    });
    // 返回 sessionId 便于前端后续刷新/登出
    return { ...tokens, sessionId };
  }

  /**
   * 用户登出逻辑，支持多端和单点登录。
   * 管理员删除 refresh-token:{userId}，普通用户删除 refresh-token:{userId}:{sessionId}
   * @param accessToken 需要作废的 access_token
   * @param sessionId 普通用户需带 sessionId
   * @returns 登出结果
   */
  async logout(
    accessToken: string,
    sessionId?: string,
    operatorId?: number,
    ip?: string,
  ): Promise<{ success: boolean; message?: string }> {
    let decoded: any = null;

    try {
      decoded = this.jwtService.decode(accessToken);
      if (!decoded || !decoded.exp) {
        this.logger.warn('Invalid access token for logout');
        throw new BadRequestException(this.i18n.t('auth.invalid_token'));
      }

      const userId = decoded.sub;
      const expiration = decoded.exp;
      const now = Math.floor(Date.now() / 1000);
      const ttl = expiration - now;

      // 判断是否为管理员
      const isAdmin = decoded.roles?.includes('admin');

      // 验证普通用户的sessionId要求
      if (!isAdmin && !sessionId) {
        this.logger.warn(
          `User ${userId} logout failed: sessionId required for non-admin users`,
        );
        throw new BadRequestException(this.i18n.t('auth.sessionid_required'));
      }

      // 1. 将 access_token 加入黑名单，防止被重用
      if (ttl > 0) {
        await this.redisService.set(`blacklist:${accessToken}`, '1', ttl);
      }

      // 2. 删除 refresh token
      let refreshTokenDeleted = false;
      if (isAdmin) {
        // 管理员单点登录，删除唯一 refresh token
        const deleteCount = await this.redisService.del(
          `${this.REFRESH_TOKEN_KEY_PREFIX}:${userId}`,
        );
        refreshTokenDeleted = deleteCount > 0;
      } else if (sessionId) {
        // 普通用户多端登录，删除指定 sessionId 的 refresh token
        const deleteCount = await this.redisService.del(
          `${this.REFRESH_TOKEN_KEY_PREFIX}:${userId}:${sessionId}`,
        );
        refreshTokenDeleted = deleteCount > 0;
      }

      this.logger.log(
        `User ${userId} logged out successfully. RefreshToken deleted: ${refreshTokenDeleted}`,
      );

      // 自动审计 - 记录成功
      await this.auditLogService.audit({
        userId: operatorId || userId,
        tenantId: decoded.tenantId,
        action: 'logout',
        resource: 'user',
        targetId: userId?.toString(),
        result: 'success',
        ip,
        detail: {
          sessionId: sessionId || 'admin',
          refreshTokenDeleted,
        },
      });

      return {
        success: true,
        message: this.i18n.t('auth.logout_success'),
      };
    } catch (error) {
      this.logger.error(
        'Error during logout process',
        error.stack,
        'AuthService',
      );

      // 记录审计日志 - 失败情况
      if (decoded) {
        try {
          await this.auditLogService.audit({
            userId: operatorId || decoded.sub,
            tenantId: decoded.tenantId,
            action: 'logout',
            resource: 'user',
            targetId: decoded.sub?.toString(),
            result: 'failure',
            ip,
            detail: {
              error: error.message,
              sessionId: sessionId || 'admin',
            },
          });
        } catch (auditError) {
          this.logger.error('Failed to record logout audit log:', auditError);
        }
      }

      // 重新抛出异常，让调用方知道登出失败
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(this.i18n.t('auth.logout_failed'));
    }
  }
  /**
   * 使用 Refresh Token 刷新 Access Token。
   * 管理员只需 userId，普通用户需带 sessionId。
   * @param token 客户端传来的 refresh token
   * @param sessionId 普通用户需带 sessionId
   * @returns 新的 access_token、refresh_token、sessionId
   */
  async refreshToken(
    token: string,
    sessionId?: string,
    operatorId?: number,
    ip?: string,
  ) {
    let payload;
    let userIdStr: string;
    let userId: number;

    try {
      // 1. 验证 Refresh Token 的签名和时效
      payload = await this.jwtService.verify(token, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      userIdStr = payload.sub;
      userId = parseInt(userIdStr, 10);

      if (isNaN(userId)) {
        throw new Error('Invalid user ID in token');
      }
    } catch (error) {
      this.logger.warn(
        `Refresh token验证失败 - IP: ${ip}, error: ${error.message}`,
      );
      throw new ForbiddenException(this.i18n.t('auth.invalid_refresh_token'));
    }

    try {
      const { roles } = payload;
      const isAdmin = roles?.includes('admin');

      // 2. 验证 sessionId 要求
      if (!isAdmin && !sessionId) {
        this.logger.warn(
          `User ${userId} refresh token failed: sessionId required for non-admin users`,
        );
        throw new ForbiddenException(this.i18n.t('auth.sessionid_required'));
      }

      // 3. 检查存储的 refresh token
      let storedToken;
      if (isAdmin) {
        // 管理员单点登录，refresh-token:{userId}
        storedToken = await this.redisService.get(
          `${this.REFRESH_TOKEN_KEY_PREFIX}:${userIdStr}`,
        );
      } else if (sessionId) {
        // 普通用户多端登录，refresh-token:{userId}:{sessionId}
        storedToken = await this.redisService.get(
          `${this.REFRESH_TOKEN_KEY_PREFIX}:${userIdStr}:${sessionId}`,
        );
      }

      if (!storedToken || storedToken !== token) {
        // 如果不一致，说明有安全风险（可能 token 已被盗用或已在别处登录），强制所有会话下线
        this.logger.warn(
          `Security risk detected for user ${userId}: refresh token mismatch`,
        );

        if (isAdmin) {
          await this.redisService.del(
            `${this.REFRESH_TOKEN_KEY_PREFIX}:${userIdStr}`,
          );
        } else if (sessionId) {
          await this.redisService.del(
            `${this.REFRESH_TOKEN_KEY_PREFIX}:${userIdStr}:${sessionId}`,
          );
        }

        // 记录安全事件审计
        await this.auditLogService.audit({
          userId: operatorId || userId,
          tenantId: payload.tenantId,
          action: 'refreshToken',
          resource: 'user',
          targetId: userIdStr,
          result: 'failure',
          ip,
          detail: {
            reason: 'token_mismatch',
            sessionId: sessionId || 'admin',
          },
        });

        throw new ForbiddenException(
          this.i18n.t('auth.refresh_token_invalidated'),
        );
      }

      // 4. 获取用户信息并验证状态
      const user = await this.userService.findOneById(userId, payload.tenantId);
      if (!user) {
        this.logger.warn(`Refresh token failed: user ${userId} not found`);
        throw new ForbiddenException(this.i18n.t('auth.user_not_found'));
      }

      // 5. 签发新的 tokens 并更新 Redis
      const tokens = await this._generateTokens(user, sessionId);
      await this._storeRefreshToken(
        user.id,
        tokens.refreshToken,
        isAdmin,
        sessionId,
      );

      // 记录成功的审计日志
      await this.auditLogService.audit({
        userId: operatorId || user.id,
        tenantId: user.tenantId,
        action: 'refreshToken',
        resource: 'user',
        targetId: user.id.toString(),
        result: 'success',
        ip,
        detail: {
          sessionId: sessionId || 'admin',
        },
      });

      this.logger.debug(`Token refreshed successfully for user ${userId}`);
      return { ...tokens, sessionId };
    } catch (error) {
      // 如果是已知的HTTP异常，直接重新抛出
      if (error instanceof HttpException) {
        throw error;
      }

      // 记录未知异常的审计日志
      this.logger.error(
        `Refresh token process failed for user ${userId}:`,
        error,
      );

      try {
        await this.auditLogService.audit({
          userId: operatorId || userId,
          tenantId: payload?.tenantId,
          action: 'refreshToken',
          resource: 'user',
          targetId: userIdStr,
          result: 'failure',
          ip,
          detail: {
            error: error.message,
            sessionId: sessionId || 'admin',
          },
        });
      } catch (auditError) {
        this.logger.error(
          'Failed to record refresh token audit log:',
          auditError,
        );
      }

      throw new InternalServerErrorException(
        this.i18n.t('auth.token_refresh_failed'),
      );
    }
  }
  /**
   * 处理单点登录请求。
   * @param ssoLoginDto
   * @returns 登录成功后我们系统自己的 token
   */
  async ssoLogin(ssoLoginDto: SsoLoginDto, ip?: string) {
    const { ssoToken } = ssoLoginDto;

    // 1. 获取 SSO 配置
    const ssoSecret = process.env.SSO_SHARED_SECRET;
    const ssoIssuer = process.env.SSO_ISSUER;

    if (!ssoSecret || !ssoIssuer) {
      this.logger.error(
        'SSO configuration (SSO_SHARED_SECRET, SSO_ISSUER) is missing.',
      );
      throw new InternalServerErrorException(
        this.i18n.t('auth.sso_not_configured'),
      );
    }

    try {
      // 2. 验证 SSO Token
      const payload = await this.jwtService.verify(ssoToken, {
        secret: ssoSecret,
        issuer: ssoIssuer,
      });

      const { sub, email, name, tenantSlug } = payload;
      if (!sub || !email || !tenantSlug) {
        throw new UnauthorizedException(this.i18n.t('auth.sso_token_invalid'));
      }

      // 3. 查找或创建用户
      const user = await this.userService.findOrCreateBySSO({
        provider: ssoIssuer,
        providerId: sub,
        email,
        username: name || email, // 如果没有提供名字，就用 email 作为用户名
        tenantSlug,
      });

      // 4. 为用户生成我们系统的 Token
      const tokens = await this.login(user, ip);
      this.logger.log(
        `User '${user.username}' logged in via SSO from issuer '${ssoIssuer}'.`,
      );
      // 自动审计
      await this.auditLogService.audit({
        userId: user.id,
        tenantId: user.tenantId,
        action: 'ssoLogin',
        resource: 'user',
        targetId: user.id?.toString(),
        result: 'success',
        ip,
        detail: { username: user.username, provider: ssoIssuer },
      });
      return { success: true, data: tokens };
    } catch (error) {
      this.logger.error('SSO login failed.', error.stack, 'AuthService');
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(this.i18n.t('auth.sso_token_invalid'));
    }
  }

  /**
   * 生成 access_token 和 refresh_token。
   * 普通用户 payload 带 sessionId，管理员不带。
   * @param user 用户部分信息
   * @param sessionId 普通用户多端登录的 sessionId
   * @private
   */
  private async _generateTokens(user: Partial<User>, sessionId?: string) {
    // 获取用户权限
    const permissions = await this._getUserPermissions(
      user.id!,
      user.tenantId!,
    );

    // 构造完整的 JWT payload（与JwtPayload接口保持一致）
    const payload = {
      sub: user.id!.toString(),
      email: user.email || '',
      username: user.username || '',
      roles: user.roles?.map((role) => role.name) || [],
      permissions: permissions,
      tenantId: user.tenantId,
      tenantSlug: user.tenant?.slug,
    };

    // 普通用户多端登录带 sessionId
    if (sessionId) {
      payload['sessionId'] = sessionId;
    }

    // 验证token配置
    const jwtSecret = process.env.JWT_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET;

    if (!jwtSecret || !refreshSecret) {
      throw new Error('JWT secrets are not configured');
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: jwtSecret,
        expiresIn: process.env.JWT_ACCESS_TOKEN_TTL || '1h',
        issuer: 'scada-studio-auth-service',
        audience: 'scada-studio-clients',
      }),
      this.jwtService.signAsync(
        {
          sub: user.id!.toString(),
          tenantId: user.tenantId,
          roles: user.roles?.map((role) => role.name) || [],
          sessionId,
        },
        {
          // refresh token 只包含必要信息
          secret: refreshSecret,
          expiresIn: process.env.JWT_REFRESH_TOKEN_TTL || '7d',
          issuer: 'scada-studio-auth-service',
          audience: 'scada-studio-clients',
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
  /**
   * 将用户的 refresh token 存储到 Redis。
   * 管理员覆盖式写入，普通用户多端写入。
   * @param userId 用户ID
   * @param token refresh token
   * @param isAdmin 是否管理员
   * @param sessionId 普通用户多端登录的 sessionId
   * @private
   */
  private async _storeRefreshToken(
    userId: number,
    token: string,
    isAdmin: boolean,
    sessionId?: string,
  ) {
    const ttlInSeconds = this._parseTtl(
      process.env.JWT_REFRESH_TOKEN_TTL || '7d',
    );
    if (isAdmin) {
      // 管理员单点登录，覆盖写入
      await this.redisService.set(
        `${this.REFRESH_TOKEN_KEY_PREFIX}:${userId}`,
        token,
        ttlInSeconds,
      );
    } else if (sessionId) {
      // 普通用户多端登录，sessionId区分
      await this.redisService.set(
        `${this.REFRESH_TOKEN_KEY_PREFIX}:${userId}:${sessionId}`,
        token,
        ttlInSeconds,
      );
    }
  }
  /**
   * 解析 TTL 字符串 (如 '7d', '1h') 为秒。
   * @param ttl 字符串
   * @private
   */
  private _parseTtl(ttl: string): number {
    const unit = ttl.charAt(ttl.length - 1);
    const value = parseInt(ttl.slice(0, -1), 10);
    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return Number(ttl);
    }
  }

  /**
   * 检查token是否在黑名单中
   * @param token access token
   * @returns boolean
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const exists = await this.redisService.get(`blacklist:${token}`);
    return !!exists;
  }

  /**
   * 验证访问token并返回用户信息
   * @param token access token
   * @returns 用户信息或null
   */
  async validateAccessToken(token: string): Promise<{
    id: number;
    username: string;
    email: string;
    tenantId: number;
    tenantSlug?: string;
    roles: string[];
    permissions: string[];
  } | null> {
    try {
      const payload = await this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });

      if (!payload || !payload.sub) {
        return null;
      }

      // 获取用户详细信息
      const user = await this.userService.findOneById(
        payload.sub,
        payload.tenantId,
      );
      if (!user) {
        return null;
      }

      // 检查用户状态
      if (user.status !== UserStatus.ACTIVE) {
        return null;
      }

      // 检查租户状态
      if (user.tenant && user.tenant.status !== TenantStatus.ACTIVE) {
        return null;
      }

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        tenantId: user.tenantId,
        tenantSlug: user.tenant?.slug,
        roles: user.roles?.map((role) => role.name) || [],
        permissions: await this._getUserPermissions(user.id, user.tenantId),
      };
    } catch (error) {
      this.logger.error('Token validation error:', error);
      return null;
    }
  }

  /**
   * 获取用户权限列表
   * @param userId 用户ID
   * @param tenantId 租户ID
   * @returns 权限列表
   * @private
   */
  private async _getUserPermissions(
    userId: number,
    tenantId: number,
  ): Promise<string[]> {
    try {
      // 这里应该调用 Casbin 或权限服务来获取用户权限
      // 暂时返回空数组，具体实现需要根据您的权限模型
      // TODO: 实现实际的权限查询逻辑

      // 模拟异步操作以消除 linter 警告
      await Promise.resolve();

      return [];
    } catch (error) {
      this.logger.error(
        `获取用户权限失败 - userId: ${userId}, tenantId: ${tenantId}:`,
        error,
      );
      return [];
    }
  }
}
