import {
  Controller,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { LoginDto, SsoLoginDto, RefreshTokenDto } from '@app/shared-dto-lib';
import { I18nService } from 'nestjs-i18n';

/**
 * AuthController 负责处理认证相关的微服务请求。
 */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly i18n: I18nService,
  ) {}

  /**
   * 生成图形验证码。
   * @returns 统一格式 {code, msg, data}
   */
  @MessagePattern('auth.generateCaptcha')
  async generateCaptcha() {
    try {
      const result = await this.authService.generateCaptcha();
      return {
        code: 0,
        msg: this.i18n.t('auth.captcha_generated_success'),
        data: result,
      };
    } catch (error) {
      return this.handleAuthError(error);
    }
  }

  /**
   * 获取验证码配置信息
   * @returns 统一格式 {code, msg, data}
   */
  @MessagePattern('auth.getCaptchaConfig')
  getCaptchaConfig() {
    try {
      const enabled = process.env.ENABLE_CAPTCHA === 'true';
      const config = {
        enabled,
        ttl: Number(process.env.CAPTCHA_TTL_SECONDS || 300),
      };

      return {
        code: 0,
        msg: this.i18n.t('auth.success'),
        data: config,
      };
    } catch (error) {
      return this.handleAuthError(error);
    }
  }

  /**
   * 处理微服务的登录消息，校验用户并返回 token。
   * @param loginDto 登录数据传输对象
   * @returns 登录结果，统一格式 {code, msg, data}
   */
  @MessagePattern('auth.login')
  async login(@Payload(new ValidationPipe()) loginDto: LoginDto) {
    try {
      // 1. 登录前置校验（失败锁定、验证码）
      await this.authService.preLoginValidate(loginDto);

      // 2. 核心用户身份验证
      const user = await this.authService.validateUser(
        loginDto.tenantSlug,
        loginDto.username,
        loginDto.password,
      );

      if (!user) {
        // 记录登录失败
        await this.authService.recordLoginAttempt(loginDto, false);
        return {
          code: 401,
          msg: this.i18n.t('auth.invalid_credentials'),
          data: null,
        };
      }

      // 3. 登录成功后处理
      await this.authService.recordLoginAttempt(loginDto, true);
      // 返回token和sessionId（普通用户）
      const token = await this.authService.login(user, loginDto.ip);
      return {
        code: 0,
        msg: this.i18n.t('auth.login_success'),
        data: token,
      };
    } catch (error) {
      // 统一错误处理，返回标准格式
      return this.handleAuthError(error);
    }
  }

  /**
   * 处理单点登录 (SSO) 请求。
   * @param ssoLoginDto 包含第三方签发的 SSO Token
   * @returns 登录成功后我们系统自己的 token
   */
  @MessagePattern('auth.ssoLogin')
  async ssoLogin(@Payload(new ValidationPipe()) ssoLoginDto: SsoLoginDto) {
    try {
      const result = await this.authService.ssoLogin(ssoLoginDto);
      return {
        code: 0,
        msg: this.i18n.t('auth.login_success'),
        data: result.data,
      };
    } catch (error) {
      return this.handleAuthError(error);
    }
  }

  /**
   * 使用 Refresh Token 获取新的 Access Token。
   * @param refreshTokenDto 包含 refreshToken 和（普通用户）sessionId
   */
  @MessagePattern('auth.refreshToken')
  async refreshToken(
    @Payload(new ValidationPipe()) refreshTokenDto: RefreshTokenDto,
  ) {
    try {
      // 普通用户多端登录需带 sessionId
      const result = await this.authService.refreshToken(
        refreshTokenDto.refreshToken,
        refreshTokenDto.sessionId,
      );
      return {
        code: 0,
        msg: this.i18n.t('auth.refresh_token_success'),
        data: result,
      };
    } catch (error) {
      return this.handleAuthError(error);
    }
  }

  /**
   * 处理登出请求
   * @param payload 登出数据
   * @returns 登出结果
   */
  @MessagePattern('auth.logout')
  async logout(
    @Payload()
    payload: {
      accessToken: string;
      sessionId?: string;
      operatorId?: number;
      ip?: string;
    },
  ) {
    try {
      const result = await this.authService.logout(
        payload.accessToken,
        payload.sessionId,
        payload.operatorId,
        payload.ip,
      );

      return {
        code: 0,
        msg: result.message,
        data: { success: result.success },
      };
    } catch (error) {
      return this.handleAuthError(error);
    }
  }

  /**
   * 验证访问token的有效性（供网关调用）
   * @param payload { token: string }
   * @returns { valid: boolean, user?: any, error?: string }
   */
  @MessagePattern('auth.validateToken')
  async validateToken(@Payload() payload: { token: string }) {
    try {
      const { token } = payload;

      if (!token) {
        return {
          code: 400,
          msg: this.i18n.t('auth.jwt_no_token'),
          data: null,
        };
      }

      // 检查token是否在黑名单中
      const isBlacklisted = await this.authService.isTokenBlacklisted(token);
      if (isBlacklisted) {
        return {
          code: 401,
          msg: this.i18n.t('auth.jwt_token_invalidated'),
          data: null,
        };
      }

      // 验证token并获取用户信息
      const user = await this.authService.validateAccessToken(token);
      if (!user) {
        return {
          code: 401,
          msg: this.i18n.t('auth.jwt_token_invalidated'),
          data: null,
        };
      }

      return {
        code: 0,
        msg: this.i18n.t('auth.validate_token_success'),
        data: { valid: true, user },
      };
    } catch (error) {
      return this.handleAuthError(error);
    }
  }

  /**
   * 统一处理认证相关的错误，返回标准格式
   */
  private handleAuthError(error: any) {
    const message = error?.message || '';

    // 租户相关错误
    if (
      message.includes('tenant_not_found') ||
      message.includes('租户不存在')
    ) {
      return {
        code: 400,
        msg: this.i18n.t('auth.tenant_not_found'),
        data: null,
      };
    }

    if (message.includes('tenant_inactive') || message.includes('租户已停用')) {
      return {
        code: 400,
        msg: this.i18n.t('auth.tenant_inactive'),
        data: null,
      };
    }

    // 用户相关错误
    if (message.includes('user_not_found') || message.includes('用户不存在')) {
      return {
        code: 401,
        msg: this.i18n.t('auth.invalid_credentials'),
        data: null,
      };
    }

    if (message.includes('user_inactive') || message.includes('用户已停用')) {
      return {
        code: 401,
        msg: this.i18n.t('auth.user_inactive'),
        data: null,
      };
    }

    if (
      message.includes('invalid_credentials') ||
      message.includes('凭据无效')
    ) {
      return {
        code: 401,
        msg: this.i18n.t('auth.invalid_credentials'),
        data: null,
      };
    }

    // 限流错误
    if (message.includes('Too many failed login attempts')) {
      return {
        code: 429,
        msg: this.i18n.t('auth.too_many_login_attempts'),
        data: null,
      };
    }

    // 验证码错误
    if (
      message.includes('captcha_required') ||
      message.includes('需要验证码')
    ) {
      return {
        code: 400,
        msg: this.i18n.t('auth.captcha_required'),
        data: null,
      };
    }

    if (message.includes('invalid_captcha') || message.includes('验证码错误')) {
      return {
        code: 400,
        msg: this.i18n.t('auth.invalid_captcha'),
        data: null,
      };
    }

    // SSO相关错误
    if (
      message.includes('sso_not_configured') ||
      message.includes('SSO未配置')
    ) {
      return {
        code: 500,
        msg: this.i18n.t('auth.sso_not_configured'),
        data: null,
      };
    }

    if (
      message.includes('sso_token_invalid') ||
      message.includes('SSO令牌无效')
    ) {
      return {
        code: 401,
        msg: this.i18n.t('auth.sso_token_invalid'),
        data: null,
      };
    }

    // Token相关错误
    if (message.includes('Token')) {
      return {
        code: 401,
        msg: message,
        data: null,
      };
    }

    if (message) {
      return {
        code: 500,
        msg: message,
        data: null,
      };
    }
    // 默认服务器错误
    return {
      code: 500,
      msg: this.i18n.t('auth.service_unavailable'),
      data: null,
    };
  }
}
