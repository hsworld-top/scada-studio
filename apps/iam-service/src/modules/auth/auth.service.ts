import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import svgCaptcha from 'svg-captcha';
import { nanoid } from 'nanoid';
import { RedisLibService } from '@app/redis-lib';
import { AppLogger } from '@app/logger-lib';
import {
  LoginDto,
  IAM_CACHE_KEYS,
  ADMIN_ROLE_NAME,
  LogoutDto,
  RefreshTokenDto,
} from '@app/shared-dto-lib';
import { UserStatus } from '@app/shared-dto-lib';
import { UserService } from '../user/user.service';
import { User } from '../user/entities/user.entity';
import * as bcrypt from 'bcrypt';
/**
 * 认证服务
 * @description 认证服务，包括登录、登出、验证码生成等
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly logger: AppLogger,
    private readonly redisService: RedisLibService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {
    this.logger.setContext(AuthService.name);
  }
  /**
   * 生成验证码
   * @description 生成验证码，并返回验证码图片
   * @returns 验证码图片
   */
  async generateCaptcha(): Promise<{ captchaId: string; dataUri: string }> {
    const captcha = svgCaptcha.create({
      size: 4, // 验证码长度
      ignoreChars: '0o1ilI', // 排除易混淆的字符
      noise: 2, // 干扰线数量
      color: true,
      background: '#f2f2f2',
    });

    const captchaId = nanoid();
    const captchaKey = `${IAM_CACHE_KEYS.CAPTCHA_CACHE}:${captchaId}`;
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
   * 登录
   * @description 根据角色判断是管理员登录还是普通用户登录
   * @param payload 登录参数
   * @returns 登录结果
   */
  async login(user: Partial<User>) {
    // 判断是否为管理员
    const isAdmin = user.roles?.some((role) => role.name === ADMIN_ROLE_NAME);
    if (isAdmin) {
      // 管理员登录
      return await this.adminLogin(user);
    } else {
      // 普通用户登录
      return await this.userLogin(user);
    }
  }
  /**
   * 管理员登录
   * @param user 用户部分信息
   * @returns 登录结果
   */
  async adminLogin(user: Partial<User>) {
    // 生成 token
    const tokens = await this._generateTokens(user);
    // 存储 refresh token，管理员单点登录覆盖写入，普通用户多端写入
    await this._storeRefreshToken(
      user.id!,
      tokens.refreshToken,
      true,
      undefined,
    );
    return { ...tokens };
  }
  /**
   * 普通用户登录
   * @param user 用户部分信息
   * @returns 登录结果
   */
  async userLogin(user: Partial<User>) {
    // 生成 token，普通用户 payload 带 sessionId
    const sessionId = nanoid();
    const tokens = await this._generateTokens(user, sessionId);
    // 存储 refresh token，管理员单点登录覆盖写入，普通用户多端写入
    await this._storeRefreshToken(
      user.id!,
      tokens.refreshToken,
      false,
      sessionId,
    );
    return { ...tokens, sessionId };
  }
  /**
   * 预登录验证
   * @param payload 登录参数
   */
  async preLoginValidate(payload: LoginDto) {
    const { tenantId, username, captchaId, captchaText } = payload;

    // 1. 检查登录失败锁定
    const maxAttempts = Number(process.env.LOGIN_MAX_ATTEMPTS || 5);
    const attemptsKey = `${IAM_CACHE_KEYS.LOGIN_ATTEMPTS_CACHE}:${tenantId}:${username}`;
    const attempts = await this.redisService.get(attemptsKey);

    if (attempts && Number(attempts) >= maxAttempts) {
      throw new Error('iam.auth.too_many_failed_login_attempts');
    }

    // 2. 检查是否需要验证码
    const captchaEnabled = process.env.ENABLE_CAPTCHA === 'true';
    if (captchaEnabled) {
      if (!captchaId || !captchaText) {
        throw new Error('iam.auth.captcha_required');
      }
      const captchaKey = `${IAM_CACHE_KEYS.CAPTCHA_CACHE}:${captchaId}`;
      const storedCaptcha = await this.redisService.get(captchaKey);

      // 无论成功失败，立即删除验证码，防止重复使用
      await this.redisService.del(captchaKey);

      if (!storedCaptcha || storedCaptcha !== captchaText.toLowerCase()) {
        throw new Error('iam.auth.invalid_captcha');
      }
    }
  }
  /**
   * 验证用户
   * @param tenantId 租户ID
   * @param username 用户名
   * @param password 密码
   * @returns 用户
   */
  async validateUser(tenantId: number, username: string, password: string) {
    // 在指定租户下查找用户
    const user = await this.userService.findOneByUsername(username, tenantId);
    if (!user) {
      throw new Error('iam.auth.user_not_found');
    }

    // 3. 检查用户状态
    if (user.status !== UserStatus.ACTIVE) {
      throw new Error('iam.auth.user_inactive');
    }

    // 4. 校验密码
    if (await bcrypt.compare(password, user.password)) {
      return user;
    }
    return null;
  }
  /**
   * 记录登录尝试
   * @param payload 登录参数
   * @param success 是否成功
   */
  async recordLoginAttempt(payload: LoginDto, success: boolean) {
    const { tenantId, username } = payload;
    const attemptsKey = `${IAM_CACHE_KEYS.LOGIN_ATTEMPTS_CACHE}:${tenantId}:${username}`;

    if (success) {
      // 登录成功，清除失败计数
      await this.redisService.del(attemptsKey);
    } else {
      const newCount = await this.redisService.incr(attemptsKey);
      if (newCount === 1) {
        // 登录失败，增加失败计数
        const lockDuration = Number(
          process.env.LOGIN_LOCK_DURATION_SECONDS || 900,
        ); // 15分钟
        // 第一次失败，设置过期时间
        await this.redisService.client.expire(attemptsKey, lockDuration);
      }
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
    const permissions = await this._getUserPermissions(user);

    // 构造完整的 JWT payload（与JwtPayload接口保持一致）
    const payload = {
      sub: user.id!.toString(),
      email: user.email || '',
      username: user.username || '',
      roles: user.roles?.map((role) => role.name) || [],
      permissions: permissions,
      tenantId: user.tenantId,
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
   * 存储 refresh token
   * @param userId 用户ID
   * @param refreshToken refresh token
   * @param isAdmin 是否管理员
   * @param sessionId 普通用户多端登录的 sessionId
   */
  private async _storeRefreshToken(
    userId: number,
    refreshToken: string,
    isAdmin: boolean,
    sessionId?: string,
  ) {
    const ttlInSeconds = Number(process.env.JWT_REFRESH_TOKEN_TTL || '604800');
    if (isAdmin) {
      // 管理员单点登录，覆盖写入
      await this.redisService.set(
        `${IAM_CACHE_KEYS.REFRESH_TOKEN_CACHE}:${userId}`,
        refreshToken,
        ttlInSeconds,
      );
    } else if (sessionId) {
      // 普通用户多端登录，sessionId区分
      await this.redisService.set(
        `${IAM_CACHE_KEYS.REFRESH_TOKEN_CACHE}:${userId}:${sessionId}`,
        refreshToken,
        ttlInSeconds,
      );
    }
  }
  /**
   * 获取用户权限
   * @param user 用户部分信息
   * @returns 用户权限
   */
  private async _getUserPermissions(user: Partial<User>) {
    // if (!user.id || !user.tenantId) {
    //   return [];
    // }
    // try {
    //   return await this.permissionService.getUserPermissions(
    //     user.id.toString(),
    //     user.tenantId.toString(),
    //   );
    // } catch (error) {
    //   this.logger.warn(
    //     `Failed to get user permissions for user ${user.id}: ${error.message}`,
    //   );
    //   return [];
    // }
  }
  /**
   * 登出
   * @param payload 登出参数
   * @returns 登出结果
   */
  async logout(payload: LogoutDto): Promise<boolean> {
    const decoded = this.jwtService.decode(payload.accessToken);
    if (!decoded || !decoded.exp) {
      throw new Error('iam.auth.invalid_token');
    }
    const userId = decoded.sub;
    const expiration = decoded.exp;
    const now = Math.floor(Date.now() / 1000);
    const ttl = expiration - now;
    const sessionId = decoded['sessionId'];
    // 判断是否为管理员
    const isAdmin = decoded.roles?.includes('admin');

    // 验证普通用户的sessionId要求
    if (!isAdmin && !sessionId) {
      throw new Error('iam.auth.sessionid_required');
    }

    // 将 access_token 加入黑名单，防止被重用
    if (ttl > 0) {
      await this.redisService.set(
        `${IAM_CACHE_KEYS.BLACKLIST_CACHE}:${payload.accessToken}`,
        '1',
        ttl,
      );
    }
    //  删除 refresh token
    let refreshTokenDeleted = false;

    if (isAdmin) {
      // 管理员单点登录，删除唯一 refresh token
      const deleteCount = await this.redisService.del(
        `${IAM_CACHE_KEYS.REFRESH_TOKEN_CACHE}:${userId}`,
      );
      refreshTokenDeleted = deleteCount > 0;
    } else if (sessionId) {
      // 普通用户多端登录，删除指定 sessionId 的 refresh token
      const deleteCount = await this.redisService.del(
        `${IAM_CACHE_KEYS.REFRESH_TOKEN_CACHE}:${userId}:${sessionId}`,
      );
      refreshTokenDeleted = deleteCount > 0;
    }
    return refreshTokenDeleted;
  }
  /**
   * 验证token是否在黑名单
   * @param accessToken 访问令牌
   * @returns 验证结果
   */
  async isTokenBlacklisted(accessToken: string): Promise<boolean> {
    const exists = await this.redisService.get(
      `${IAM_CACHE_KEYS.BLACKLIST_CACHE}:${accessToken}`,
    );
    return !exists;
  }
  /**
   * 验证访问token并返回用户信息
   * @param accessToken access token
   * @returns 用户信息或null
   */
  async validateAccessToken(accessToken: string) {
    // 验证token
    const payload = await this.jwtService.verify(accessToken, {
      secret: process.env.JWT_SECRET,
    });
    // 验证token是否有效
    if (!payload || !payload.sub) {
      return null;
    }
    // 获取用户详细信息
    const user = await this.userService.findOneByUsername(
      payload.username,
      payload.tenantId,
    );
    if (!user) {
      return null;
    }

    // 检查用户状态
    if (user.status !== UserStatus.ACTIVE) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      tenantId: user.tenantId,
      roles: user.roles?.map((role) => role.name) || [],
      permissions: await this._getUserPermissions(user),
    };
  }
  /**
   * 刷新token
   * @param payload 刷新token参数
   * @returns 刷新token结果
   */
  async refreshToken(payload: RefreshTokenDto) {
    // 验证 Refresh Token 的签名和时效
    const decoded = await this.jwtService.verify(payload.refreshToken, {
      secret: process.env.JWT_REFRESH_SECRET,
    });
    const userId = decoded.sub;
    if (!userId) {
      throw new Error('iam.auth.refresh_token_invalidated');
    }
    const roles = decoded.roles;
    const tenantId = decoded.tenantId;
    const isAdmin = roles?.includes(ADMIN_ROLE_NAME);
    const sessionId = payload.sessionId;

    if (!isAdmin && !sessionId) {
      throw new Error('iam.auth.sessionid_required');
    }

    // 检查存储的 refresh token
    let storedToken;
    if (isAdmin) {
      // 管理员单点登录，refresh-token:{userId}
      storedToken = await this.redisService.get(
        `${IAM_CACHE_KEYS.REFRESH_TOKEN_CACHE}:${userId}`,
      );
    } else if (sessionId) {
      // 普通用户多端登录，refresh-token:{userId}:{sessionId}
      storedToken = await this.redisService.get(
        `${IAM_CACHE_KEYS.REFRESH_TOKEN_CACHE}:${userId}:${sessionId}`,
      );
      if (!storedToken || storedToken !== payload.refreshToken) {
        if (isAdmin) {
          await this.redisService.del(
            `${IAM_CACHE_KEYS.REFRESH_TOKEN_CACHE}:${userId}`,
          );
        } else if (sessionId) {
          await this.redisService.del(
            `${IAM_CACHE_KEYS.REFRESH_TOKEN_CACHE}:${userId}:${sessionId}`,
          );
        }
        throw new Error('iam.auth.refresh_token_invalidated');
      }
    }

    // 获取用户信息并验证状态
    const user = await this.userService.findOne(tenantId, userId);
    if (!user) {
      throw new Error('iam.auth.user_not_found');
    }

    // 5. 签发新的 tokens 并更新 Redis
    const tokens = await this._generateTokens(user, sessionId);
    await this._storeRefreshToken(
      user.id,
      tokens.refreshToken,
      isAdmin,
      sessionId,
    );

    return { ...tokens };
  }
}
