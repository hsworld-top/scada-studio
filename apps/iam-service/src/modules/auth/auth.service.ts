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
import { UserStatus, LoginDto, SsoLoginDto } from '@app/shared-dto-lib';
import { AppLogger } from '@app/logger-lib';
import { I18nService } from 'nestjs-i18n';
import { AuditService } from '../audit/audit.service';
import { TenantIntegrationService } from '../tenant/tenant-integration.service';

/**
 * IAM认证服务
 * 负责租户用户的认证相关功能，包括登录、登出、token管理等
 * 与platform-core的租户管理进行集成
 */
@Injectable()
export class AuthService {
  private readonly LOGIN_ATTEMPTS_KEY_PREFIX = 'iam:login-attempts';
  private readonly CAPTCHA_KEY_PREFIX = 'iam:captcha';
  private readonly REFRESH_TOKEN_KEY_PREFIX = 'iam:refresh-token';
  private readonly TENANT_STATUS_KEY_PREFIX = 'iam:tenant:status';

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private redisService: RedisLibService,
    private readonly logger: AppLogger,
    private readonly i18n: I18nService,
    private readonly auditService: AuditService,
    private readonly tenantIntegrationService: TenantIntegrationService,
  ) {
    this.logger.setContext('AuthService');
  }

  /**
   * 生成图形验证码
   * @returns 验证码ID和SVG图像数据
   */
  async generateCaptcha(): Promise<{
    captchaId: string;
    dataUri: string;
  }> {
    const captcha = svgCaptcha.create({
      size: 4,
      ignoreChars: '0o1i',
      noise: 2,
      color: true,
      background: '#f2f2f2',
    });

    const captchaId = nanoid();
    const captchaKey = `${this.CAPTCHA_KEY_PREFIX}:${captchaId}`;
    const captchaTTL = Number(process.env.CAPTCHA_TTL_SECONDS || 300);

    // 将验证码文本存入Redis
    await this.redisService.set(
      captchaKey,
      captcha.text.toLowerCase(),
      captchaTTL,
    );

    const svgBase64 = Buffer.from(captcha.data).toString('base64');
    const dataUri = `data:image/svg+xml;base64,${svgBase64}`;

    return {
      captchaId,
      dataUri,
    };
  }

  /**
   * 登录前置校验，包括失败锁定和验证码
   * @param loginDto 登录数据
   */
  async preLoginValidate(loginDto: LoginDto): Promise<void> {
    const { tenantSlug, username, captchaId, captchaText } = loginDto;

    // 1. 检查登录失败锁定
    const loginAttemptsKey = `${this.LOGIN_ATTEMPTS_KEY_PREFIX}:${tenantSlug}:${username}`;
    const attempts = await this.redisService.get(loginAttemptsKey);
    const maxAttempts = Number(process.env.MAX_LOGIN_ATTEMPTS || 5);

    if (attempts && parseInt(attempts) >= maxAttempts) {
      const lockoutDuration = Number(
        process.env.LOCKOUT_DURATION_MINUTES || 15,
      );
      const lockoutKey = `${this.LOGIN_ATTEMPTS_KEY_PREFIX}:lockout:${tenantSlug}:${username}`;
      const lockoutTime = await this.redisService.get(lockoutKey);

      if (lockoutTime) {
        const remainingTime = Math.ceil(
          (parseInt(lockoutTime) + lockoutDuration * 60 * 1000 - Date.now()) /
            1000 /
            60,
        );
        throw new ForbiddenException(
          this.i18n.t('auth.account_locked', { minutes: remainingTime }),
        );
      }
    }

    // 2. 验证码校验
    if (captchaId && captchaText) {
      const captchaKey = `${this.CAPTCHA_KEY_PREFIX}:${captchaId}`;
      const storedCaptcha = await this.redisService.get(captchaKey);

      if (!storedCaptcha || storedCaptcha !== captchaText.toLowerCase()) {
        await this.recordLoginAttempt(loginDto, false);
        throw new BadRequestException(this.i18n.t('auth.captcha_invalid'));
      }

      // 验证成功后删除验证码
      await this.redisService.del(captchaKey);
    }
  }

  /**
   * 记录登录尝试
   * @param loginDto 登录数据
   * @param success 是否成功
   */
  async recordLoginAttempt(
    loginDto: LoginDto,
    success: boolean,
  ): Promise<void> {
    const { tenantSlug, username } = loginDto;
    const loginAttemptsKey = `${this.LOGIN_ATTEMPTS_KEY_PREFIX}:${tenantSlug}:${username}`;

    if (success) {
      // 登录成功，清除失败记录
      await this.redisService.del(loginAttemptsKey);
      const lockoutKey = `${this.LOGIN_ATTEMPTS_KEY_PREFIX}:lockout:${tenantSlug}:${username}`;
      await this.redisService.del(lockoutKey);
    } else {
      // 登录失败，增加失败计数
      const attempts = await this.redisService.get(loginAttemptsKey);
      const currentAttempts = attempts ? parseInt(attempts) : 0;
      const newAttempts = currentAttempts + 1;

      await this.redisService.set(
        loginAttemptsKey,
        newAttempts.toString(),
        3600,
      ); // 1小时过期

      // 如果达到最大尝试次数，设置锁定
      const maxAttempts = Number(process.env.MAX_LOGIN_ATTEMPTS || 5);
      if (newAttempts >= maxAttempts) {
        const lockoutKey = `${this.LOGIN_ATTEMPTS_KEY_PREFIX}:lockout:${tenantSlug}:${username}`;
        await this.redisService.set(lockoutKey, Date.now().toString(), 900); // 15分钟锁定
      }
    }
  }

  /**
   * 验证用户凭据
   * @param tenantSlug 租户标识
   * @param username 用户名
   * @param password 密码
   * @returns 用户信息（不含密码）
   */
  async validateUser(
    tenantSlug: string,
    username: string,
    password: string,
  ): Promise<Partial<User> | null> {
    try {
      // 这里需要先通过platform-core获取租户ID
      // 暂时使用模拟的租户ID，实际应该调用platform-core服务
      const tenantId = await this.getTenantIdBySlug(tenantSlug);
      if (!tenantId) {
        throw new BadRequestException(this.i18n.t('auth.tenant_not_found'));
      }

      const user = await this.userService.findByUsername(tenantId, username);
      if (!user) {
        return null;
      }

      // 检查用户状态
      if (user.status !== UserStatus.ACTIVE) {
        throw new ForbiddenException(this.i18n.t('auth.account_disabled'));
      }

      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return null;
      }

      // 返回用户信息（不含密码）
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      this.logger.error('User validation failed', error);
      throw error;
    }
  }

  /**
   * 用户登录
   * @param user 用户信息
   * @param ip 客户端IP
   * @returns 登录结果
   */
  async login(user: Partial<User>, ip?: string) {
    try {
      const sessionId = nanoid();
      const { accessToken, refreshToken } = await this.generateTokens(
        user,
        sessionId,
      );

      // 存储刷新token
      await this.storeRefreshToken(user.id, refreshToken, sessionId);

      // 记录审计日志
      await this.auditService.audit({
        userId: user.id,
        action: 'login',
        resource: 'auth',
        targetId: user.id.toString(),
        detail: { username: user.username, ip },
        result: 'success',
      });

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          tenantId: user.tenantId,
        },
      };
    } catch (error) {
      this.logger.error('Login failed', error);
      throw new InternalServerErrorException(this.i18n.t('auth.login_failed'));
    }
  }

  /**
   * 用户登出
   * @param accessToken 访问令牌
   * @param sessionId 会话ID
   * @param operatorId 操作者ID
   * @param ip 客户端IP
   * @returns 登出结果
   */
  async logout(
    accessToken: string,
    sessionId?: string,
    operatorId?: number,
    ip?: string,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      // 将token加入黑名单
      const tokenPayload = this.jwtService.decode(accessToken) as any;
      if (tokenPayload && tokenPayload.exp) {
        const ttl = tokenPayload.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await this.redisService.set(`iam:blacklist:${accessToken}`, '1', ttl);
        }
      }

      // 删除刷新token
      if (sessionId) {
        await this.redisService.del(
          `${this.REFRESH_TOKEN_KEY_PREFIX}:${sessionId}`,
        );
      }

      // 记录审计日志
      await this.auditService.audit({
        userId: operatorId,
        action: 'logout',
        resource: 'auth',
        targetId: operatorId?.toString() || 'unknown',
        detail: { ip },
        result: 'success',
      });

      return { success: true, message: this.i18n.t('auth.logout_success') };
    } catch (error) {
      this.logger.error('Logout failed', error);
      return { success: false, message: this.i18n.t('auth.logout_failed') };
    }
  }

  /**
   * 刷新访问令牌
   * @param refreshToken 刷新令牌
   * @param sessionId 会话ID
   * @param operatorId 操作者ID
   * @param ip 客户端IP
   * @returns 新的访问令牌
   */
  async refreshToken(
    refreshToken: string,
    sessionId?: string,
    operatorId?: number,
    ip?: string,
  ) {
    try {
      // 验证刷新token
      const storedToken = await this.redisService.get(
        `${this.REFRESH_TOKEN_KEY_PREFIX}:${sessionId}`,
      );

      if (!storedToken || storedToken !== refreshToken) {
        throw new UnauthorizedException(
          this.i18n.t('auth.invalid_refresh_token'),
        );
      }

      // 解析token获取用户信息
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.userService.findOne(
        payload.userId,
        payload.tenantId,
      );

      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException(
          this.i18n.t('auth.user_not_found_or_inactive'),
        );
      }

      // 生成新的访问令牌
      const newAccessToken = this.jwtService.sign(
        {
          userId: user.id,
          username: user.username,
          email: user.email,
          tenantId: user.tenantId,
          sessionId,
        },
        { expiresIn: '60m' },
      );

      // 记录审计日志
      await this.auditService.audit({
        userId: operatorId,
        action: 'refresh_token',
        resource: 'auth',
        targetId: user.id.toString(),
        detail: { ip },
        result: 'success',
      });

      return { accessToken: newAccessToken };
    } catch (error) {
      this.logger.error('Token refresh failed', error);
      throw new UnauthorizedException(this.i18n.t('auth.token_refresh_failed'));
    }
  }

  /**
   * 验证访问令牌
   * @param token 访问令牌
   * @returns 令牌载荷信息
   */
  async validateAccessToken(token: string): Promise<{
    id: number;
    username: string;
    email: string;
    tenantId: number;
    roles: string[];
    permissions: string[];
  } | null> {
    try {
      // 检查token是否在黑名单中
      const isBlacklisted = await this.redisService.get(
        `iam:blacklist:${token}`,
      );
      if (isBlacklisted) {
        return null;
      }

      const payload = this.jwtService.verify(token);
      const user = await this.userService.findOne(
        payload.userId,
        payload.tenantId,
      );

      if (!user || user.status !== UserStatus.ACTIVE) {
        return null;
      }

      // 获取用户权限
      const permissions = await this.getUserPermissions(user.id, user.tenantId);

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        tenantId: user.tenantId,
        roles: user.roles?.map((role) => role.name) || [],
        permissions,
      };
    } catch (error) {
      this.logger.error('Token validation failed', error);
      return null;
    }
  }

  /**
   * 生成访问令牌和刷新令牌
   * @param user 用户信息
   * @param sessionId 会话ID
   * @returns 令牌对
   */
  private async generateTokens(user: Partial<User>, sessionId?: string) {
    const accessToken = this.jwtService.sign(
      {
        userId: user.id,
        username: user.username,
        email: user.email,
        tenantId: user.tenantId,
        sessionId,
      },
      { expiresIn: '60m' },
    );

    const refreshToken = this.jwtService.sign(
      {
        userId: user.id,
        tenantId: user.tenantId,
        sessionId,
      },
      { expiresIn: '7d' },
    );

    return { accessToken, refreshToken };
  }

  /**
   * 存储刷新令牌
   * @param userId 用户ID
   * @param token 刷新令牌
   * @param sessionId 会话ID
   */
  private async storeRefreshToken(
    userId: number,
    token: string,
    sessionId?: string,
  ) {
    const key = `${this.REFRESH_TOKEN_KEY_PREFIX}:${sessionId}`;
    const ttl = this.parseTtl('7d');
    await this.redisService.set(key, token, ttl);
  }

  /**
   * 解析TTL字符串为秒数
   * @param ttl TTL字符串
   * @returns 秒数
   */
  private parseTtl(ttl: string): number {
    const match = ttl.match(/^(\d+)([smhd])$/);
    if (!match) return 3600; // 默认1小时

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 3600;
    }
  }

  /**
   * 获取用户权限列表
   * @param userId 用户ID
   * @param tenantId 租户ID
   * @returns 权限列表
   */
  private async getUserPermissions(
    userId: number,
    tenantId: number,
  ): Promise<string[]> {
    try {
      // 这里应该调用权限服务获取用户权限
      // 暂时返回空数组，实际实现时需要集成权限模块
      return [];
    } catch (error) {
      this.logger.error('Failed to get user permissions', error);
      return [];
    }
  }

  /**
   * 根据租户标识获取租户ID
   * @param tenantSlug 租户标识
   * @returns 租户ID
   */
  private async getTenantIdBySlug(tenantSlug: string): Promise<number | null> {
    try {
      const tenantInfo =
        await this.tenantIntegrationService.getTenantBySlug(tenantSlug);
      return tenantInfo?.id || null;
    } catch (error) {
      this.logger.error('Failed to get tenant ID by slug', error);
      return null;
    }
  }
}
