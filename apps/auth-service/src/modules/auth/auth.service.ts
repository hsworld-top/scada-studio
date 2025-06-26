import {
  Injectable,
  Inject,
  forwardRef,
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
import { User, UserStatus } from '../user/entities/user.entity';
import { AppLogger } from '@app/logger-lib';
import { InjectRepository } from '@nestjs/typeorm';
import { Tenant, TenantStatus } from '../tenant/entities/tenant.entity';
import { Repository } from 'typeorm';
import { LoginDto } from './dto/login.dto';
import { SsoLoginDto } from './dto/sso-login.dto';

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
    @Inject(forwardRef(() => RedisLibService))
    private redisService: RedisLibService,
    private readonly logger: AppLogger,
    @InjectRepository(Tenant) private tenantRepository: Repository<Tenant>,
  ) {}

  /**
   * 生成图形验证码。
   * @returns {Promise<{ captchaId: string, svg: string }>} 验证码ID和SVG图像数据
   */
  async generateCaptcha(): Promise<{ captchaId: string; svg: string }> {
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

    return { captchaId, svg: captcha.data };
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
        throw new BadRequestException('Captcha is required.');
      }
      const captchaKey = `${this.CAPTCHA_KEY_PREFIX}:${captchaId}`;
      const storedCaptcha = await this.redisService.get(captchaKey);

      // 无论成功失败，立即删除验证码，防止重复使用
      await this.redisService.del(captchaKey);

      if (!storedCaptcha || storedCaptcha !== captchaText.toLowerCase()) {
        throw new BadRequestException('Invalid captcha.');
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
      return null;
    }
    if (tenant.status !== TenantStatus.ACTIVE) {
      this.logger.warn(
        `Login attempt for inactive tenant: ${tenant.name} (${tenant.slug})`,
      );
      throw new UnauthorizedException(`Tenant '${tenant.name}' is not active.`);
    }

    // 2. 在指定租户下查找用户
    const user = await this.userService.findOneByUsername(username, tenant.id);
    if (!user) {
      return null;
    }

    // 3. 检查用户状态
    if (user.status !== UserStatus.ACTIVE) {
      this.logger.warn(
        `Login attempt for inactive user: ${username} in tenant ${tenant.name}`,
      );
      throw new UnauthorizedException(`User account is not active.`);
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
   * @param user 用户信息
   * @returns 包含 access_token 的对象
   */
  async login(user: Partial<User>) {
    const tokens = await this._generateTokens(user);
    await this._storeRefreshToken(user.id!, tokens.refreshToken);
    return tokens;
  }

  /**
   * 用户登出逻辑，增加了对 refresh token 的处理。
   * @param accessToken 需要作废的 access_token
   */
  async logout(accessToken: string): Promise<void> {
    try {
      const decoded = this.jwtService.decode(accessToken);
      if (!decoded || !decoded.exp) return;

      const userId = decoded.sub;
      const expiration = decoded.exp;
      const now = Math.floor(Date.now() / 1000);
      const ttl = expiration - now;

      // 1. 将 access_token 加入黑名单
      if (ttl > 0) {
        await this.redisService.set(`blacklist:${accessToken}`, '1', ttl);
      }

      // 2. 从 Redis 中删除 refresh token，实现会话的彻底终止
      await this.redisService.del(`${this.REFRESH_TOKEN_KEY_PREFIX}:${userId}`);
      this.logger.log(
        `User ${userId} logged out and refresh token was revoked.`,
      );
    } catch (error) {
      this.logger.error(
        'Error during logout process',
        error.stack,
        'AuthService',
      );
    }
  }
  /**
   * 使用 Refresh Token 刷新 Access Token。
   * @param token 客户端传来的 refresh token
   * @returns 新的 access_token 和 refresh_token
   */
  async refreshToken(token: string) {
    let payload;
    try {
      // 1. 验证 Refresh Token 的签名和时效
      payload = await this.jwtService.verify(token, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch (error) {
      throw new ForbiddenException(
        'Invalid or expired refresh token.' + error.message,
      );
    }

    const { sub: userId } = payload;

    // 2. 校验 Redis 中存储的 Token 是否与客户端传来的一致
    const storedToken = await this.redisService.get(
      `${this.REFRESH_TOKEN_KEY_PREFIX}:${userId}`,
    );
    if (!storedToken || storedToken !== token) {
      // 如果不一致，说明有安全风险（可能 token 已被盗用或已在别处登录），强制所有会话下线
      await this.redisService.del(`${this.REFRESH_TOKEN_KEY_PREFIX}:${userId}`);
      throw new ForbiddenException(
        'Refresh token has been invalidated. Please log in again.',
      );
    }

    const user = await this.userService.findOneById(userId, payload.tenantId);
    if (!user) {
      throw new ForbiddenException('User not found.');
    }

    // 3. 签发新的 tokens 并更新 Redis
    const tokens = await this._generateTokens(user);
    await this._storeRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }
  /**
   * 处理单点登录请求。
   * @param ssoLoginDto
   * @returns 登录成功后我们系统自己的 token
   */
  async ssoLogin(ssoLoginDto: SsoLoginDto) {
    const { token } = ssoLoginDto;

    // 1. 获取 SSO 配置
    const ssoSecret = process.env.SSO_SHARED_SECRET;
    const ssoIssuer = process.env.SSO_ISSUER;

    if (!ssoSecret || !ssoIssuer) {
      this.logger.error(
        'SSO configuration (SSO_SHARED_SECRET, SSO_ISSUER) is missing.',
      );
      throw new InternalServerErrorException(
        'SSO is not configured correctly.',
      );
    }

    try {
      // 2. 验证 SSO Token
      const payload = await this.jwtService.verify(token, {
        secret: ssoSecret,
        issuer: ssoIssuer,
      });

      const { sub, email, name, tenantSlug } = payload;
      if (!sub || !email || !tenantSlug) {
        throw new UnauthorizedException(
          'Invalid SSO token payload. Missing required fields.',
        );
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
      const tokens = await this.login(user);
      this.logger.log(
        `User '${user.username}' logged in via SSO from issuer '${ssoIssuer}'.`,
      );

      return { success: true, data: tokens };
    } catch (error) {
      this.logger.error('SSO login failed.', error.stack, 'AuthService');
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid SSO token.');
    }
  }

  /**
   * 生成 access_token 和 refresh_token。
   * @param user 用户部分信息
   * @private
   */
  private async _generateTokens(user: Partial<User>) {
    const payload = {
      username: user.username,
      sub: user.id!.toString(),
      tenantId: user.tenantId,
      tenantSlug: user.tenant?.slug,
      roles: user.roles?.map((role) => role.name),
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_ACCESS_TOKEN_TTL,
      }),
      this.jwtService.signAsync(
        { sub: user.id!.toString(), tenantId: user.tenantId },
        {
          // refresh token 只包含必要信息
          secret: process.env.JWT_REFRESH_SECRET,
          expiresIn: process.env.JWT_REFRESH_TOKEN_TTL,
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
  /**
   * 将用户的 refresh token 存储到 Redis (覆盖式写入，实现单点登录)。
   * @param userId 用户ID
   * @param token refresh token
   * @private
   */
  private async _storeRefreshToken(userId: number, token: string) {
    const ttlInSeconds = this._parseTtl(
      process.env.JWT_REFRESH_TOKEN_TTL || '7d',
    );
    await this.redisService.set(
      `${this.REFRESH_TOKEN_KEY_PREFIX}:${userId}`,
      token,
      ttlInSeconds,
    );
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
}
