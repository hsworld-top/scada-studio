import {
  Injectable,
  Inject,
  forwardRef,
  UnauthorizedException,
  BadRequestException,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
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
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dto/login.dto';
import { SsoLoginDto } from './dto/sso-login.dto';

/**
 * AuthService 提供认证相关的服务（多租户版，带登录增强和SSO）。
 */
@Injectable()
export class AuthService {
  private readonly LOGIN_ATTEMPTS_KEY_PREFIX = 'login-attempts';
  private readonly CAPTCHA_KEY_PREFIX = 'captcha';

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private readonly configService: ConfigService,
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
    const captchaTTL = this.configService.get<number>(
      'CAPTCHA_TTL_SECONDS',
      300,
    ); // 5分钟有效期

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
    const maxAttempts = this.configService.get<number>('LOGIN_MAX_ATTEMPTS', 5);
    const attemptsKey = `${this.LOGIN_ATTEMPTS_KEY_PREFIX}:${tenantSlug}:${username}`;
    const attempts = await this.redisService.get(attemptsKey);

    if (attempts && Number(attempts) >= maxAttempts) {
      throw new HttpException(
        'Too many failed login attempts. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // 2. 检查是否需要验证码
    const captchaEnabled =
      this.configService.get<string>('ENABLE_CAPTCHA') === 'true';
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
      const lockDuration = this.configService.get<number>(
        'LOGIN_LOCK_DURATION_SECONDS',
        900,
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
  login(user: Partial<User>) {
    const payload = {
      username: user.username,
      sub: user.id?.toString(),
      tenantId: user.tenantId,
      tenantSlug: user.tenant?.slug,
      roles: user.roles?.map((role) => role.name),
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  /**
   * 用户登出，将 token 加入黑名单，设置过期时间。
   * @param token 需要作废的 JWT token
   */
  async logout(token: string): Promise<void> {
    try {
      const decoded = this.jwtService.decode(token);
      if (!decoded || !decoded.exp) return;

      const expiration = decoded.exp;
      const now = Math.floor(Date.now() / 1000);
      const ttl = expiration - now;

      if (ttl > 0) {
        await this.redisService.set(`blacklist:${token}`, '1', ttl);
      }
    } catch (error) {
      this.logger.error(
        'Error during logout process',
        error.stack,
        'AuthService',
      );
    }
  }

  /**
   * 处理单点登录请求。
   * @param ssoLoginDto
   * @returns 登录成功后我们系统自己的 token
   */
  async ssoLogin(ssoLoginDto: SsoLoginDto) {
    const { token } = ssoLoginDto;

    // 1. 获取 SSO 配置
    const ssoSecret = this.configService.get<string>('SSO_SHARED_SECRET');
    const ssoIssuer = this.configService.get<string>('SSO_ISSUER');

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
      const ourToken = this.login(user);
      this.logger.log(
        `User '${user.username}' logged in via SSO from issuer '${ssoIssuer}'.`,
      );

      return { success: true, data: ourToken };
    } catch (error) {
      this.logger.error('SSO login failed.', error.stack, 'AuthService');
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid SSO token.');
    }
  }
}
